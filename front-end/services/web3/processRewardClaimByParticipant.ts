import { closedSurveyV5ContractABI } from '@/utils/abis/closedSurveyV5ContractABI';
import { Address, createPublicClient, createWalletClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export type ProcessRewardClaimResult = {
  success: boolean;
  transactionHash: string | null;
};

export type ProcessRewardClaimByParticipantProps = {
  _smartContractAddress: Address;
  _participantWalletAddress: Address;
  _rewardId: string,
  _nonce: BigInt
  _chainId: number;
  _signature: string;
};

export const processRewardClaimByParticipant = async (
  _signerAddress: `0x${string}` | undefined,
  {
    _smartContractAddress: smartContractAddress,
    _participantWalletAddress: participantWalletAddress,
    _rewardId,
    _nonce,
    _signature,
    _chainId
  }: ProcessRewardClaimByParticipantProps
): Promise<ProcessRewardClaimResult> => {
  if (!window.ethereum) {
    return { success: false, transactionHash: null };
  }

  const privateClient = createWalletClient({
    chain: _chainId === celo.id ? celo : celoAlfajores,
    transport: custom(window.ethereum),
  });

  const publicClient = createPublicClient({
    chain: _chainId === celo.id ? celo : celoAlfajores,
    transport: custom(window.ethereum),
  });

  try {
    const [address] = await privateClient.getAddresses();

    const { request: processRewardClaimByParticipantRqst } =
      await publicClient.simulateContract({
        account: address,
        address: smartContractAddress,
        abi: closedSurveyV5ContractABI,
        functionName: 'processRewardClaimByParticipant',
        args: [participantWalletAddress, _rewardId, _nonce, _signature],
      });

    const processRewardClaimByParticipantTxnHash =
      await privateClient.writeContract(processRewardClaimByParticipantRqst);

    const processRewardClaimByParticipantTxnReceipt =
      await publicClient.waitForTransactionReceipt({
        hash: processRewardClaimByParticipantTxnHash,
      });

    return {
      success: processRewardClaimByParticipantTxnReceipt.status === 'success',
      transactionHash: processRewardClaimByParticipantTxnHash,
    };
  } catch (err) {
    return { success: false, transactionHash: null };
  }
};
