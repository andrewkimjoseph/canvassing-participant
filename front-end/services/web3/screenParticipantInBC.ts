import { closedSurveyV6ContractABI } from "@/utils/abis/closedSurveyV6ContractABI";
import { Address, createPublicClient, createWalletClient, custom } from "viem";
import { celoAlfajores } from "viem/chains";
import { celo } from "viem/chains";

export type ScreenParticipantResult = {
  success: boolean;
  transactionHash: string | null;
};

export type ScreenParticipantProps = {
  _smartContractAddress: Address;
  _participantWalletAddress: Address;
  _nonce: BigInt;
  _chainId: number;
  _signature: string;
  _surveyId: string;
};

export const screenParticipantInBC = async ({
  _smartContractAddress: smartContractAddress,
  _participantWalletAddress: participantWalletAddress,
  _nonce,
  _chainId,
  _signature,
  _surveyId,
}: ScreenParticipantProps): Promise<ScreenParticipantResult> => {
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

    const { request: screenParticipantRqst } =
      await publicClient.simulateContract({
        account: address,
        address: smartContractAddress,
        abi: closedSurveyV6ContractABI,
        functionName: "screenParticipant",
        args: [participantWalletAddress, _surveyId, _nonce, _signature],
      });

    const screenParticipantTxnHash = await privateClient.writeContract(
      screenParticipantRqst
    );

    const screenParticipantTxnReceipt =
      await publicClient.waitForTransactionReceipt({
        hash: screenParticipantTxnHash,
      });

    return {
      success: screenParticipantTxnReceipt.status === "success",
      transactionHash: screenParticipantTxnHash,
    };
  } catch (err) {
    return { success: false, transactionHash: null };
  }
};
