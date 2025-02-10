import { closedSurveyV4ContractABI } from "@/utils/abis/closedSurveyV4ContractABI";
import { Address, createPublicClient, custom } from "viem";
import { celoAlfajores, celo } from "viem/chains";

export const checkIfParticipantIsScreenedInBC = async (
  {
    _participantWalletAddress,
    _surveyContractAddress,
    _chainId
  }: CheckIfParticipantIsScreenedInBCProps
): Promise<boolean> => {
  if (window.ethereum) {
    try {
      const publicClient = createPublicClient({
        chain: _chainId === celo.id ? celo : celoAlfajores,
        transport: custom(window.ethereum),
      });
      try {
        const userIsScreened =
          await publicClient.readContract({
            address: _surveyContractAddress,
            abi: closedSurveyV4ContractABI,
            functionName: "checkIfParticipantIsScreened",
            args: [_participantWalletAddress],
          });
        return userIsScreened as boolean;
      } catch (err) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  return false;
};

export type CheckIfParticipantIsScreenedInBCProps = {
  _participantWalletAddress: Address;
  _surveyContractAddress: Address;
  _chainId: number
};
