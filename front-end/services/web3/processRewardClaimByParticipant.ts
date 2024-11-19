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
    
    const createDonationAccountTxnHash = await privateClient.writeContract({
      account: address,
      address: smartContractAddress,
      abi: canvassingSurveyContractABI,
      functionName: 'processRewardClaimByParticipant',
      args: [participantWalletAddress],
    });

    const createDonationTxnReceipt = await publicClient.waitForTransactionReceipt({
      hash: createDonationAccountTxnHash,
    });

    return {
      success: createDonationTxnReceipt.status === 'success',
      transactionHash: createDonationAccountTxnHash
    };
  } catch (err) {
    console.error(err);
    return { success: false, transactionHash: null };
  }
};