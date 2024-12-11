import { canvassingSurveyContractABI } from '@/utils/abis/canvassingSurveyContractABI';
import { Address, createPublicClient, createWalletClient, custom } from 'viem';
// import { celoAlfajores } from 'viem/chains';
import { celo } from 'viem/chains';

export type ProcessRewardClaimResult = {
  success: boolean;
  transactionHash: string | null;
};

export type ProcessRewardClaimByParticipantProps = {
  _smartContractAddress: Address;
  _participantWalletAddress: Address;
};

export const processRewardClaimByParticipant = async (
  _signerAddress: `0x${string}` | undefined,
  {
    _smartContractAddress: smartContractAddress,
    _participantWalletAddress: participantWalletAddress,
  }: ProcessRewardClaimByParticipantProps
): Promise<ProcessRewardClaimResult> => {
  if (!window.ethereum) {
    return { success: false, transactionHash: null };
  }

  const privateClient = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
  });

  const publicClient = createPublicClient({
    chain: celo,
    transport: custom(window.ethereum),
  });

  try {
    const [address] = await privateClient.getAddresses();

    const { request: processRewardClaimByParticipantRqst } =
      await publicClient.simulateContract({
        account: address,
        address: smartContractAddress,
        abi: canvassingSurveyContractABI,
        functionName: 'processRewardClaimByParticipant',
        args: [participantWalletAddress],
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
    console.error(err);
    return { success: false, transactionHash: null };
  }
};
