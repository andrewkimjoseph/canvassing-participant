import { closedSurveyV3ContractABI } from '@/utils/abis/closedSurveyV3ContractABI';
import { Address, createPublicClient, createWalletClient, custom } from 'viem';
// import { celoAlfajores } from 'viem/chains';
import { celo } from 'viem/chains';

export type ScreenParticipantResult = {
  success: boolean;
  transactionHash: string | null;
};

export type ScreenParticipantProps = {
  _smartContractAddress: Address;
  _participantWalletAddress: Address;
};

export const screenParticipantInBC = async (
  {
    _smartContractAddress: smartContractAddress,
    _participantWalletAddress: participantWalletAddress,
  }: ScreenParticipantProps
): Promise<ScreenParticipantResult> => {
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

    const { request: screenParticipantRqst } =
      await publicClient.simulateContract({
        account: address,
        address: smartContractAddress,
        abi: closedSurveyV3ContractABI,
        functionName: 'screenParticipant',
        args: [participantWalletAddress],
      });

    const screenParticipantTxnHash =
      await privateClient.writeContract(screenParticipantRqst);

    const screenParticipantTxnReceipt =
      await publicClient.waitForTransactionReceipt({
        hash: screenParticipantTxnHash,
      });

    return {
      success: screenParticipantTxnReceipt.status === 'success',
      transactionHash: screenParticipantTxnHash,
    };
  } catch (err) {
    return { success: false, transactionHash: null };
  }
};
