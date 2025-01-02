import { closedSurveyV3ContractABI } from "@/utils/abis/closedSurveyV3ContractABI";
import { Address, createPublicClient, custom } from "viem";
// import { celoAlfajores } from "viem/chains";
import { celo } from "viem/chains";

export const checkIfParticipantIsScreenedInBC = async (
  {
    _participantWalletAddress,
    _surveyContractAddress
  }: CheckIfParticipantIsScreenedInBCProps
): Promise<boolean> => {
  if (window.ethereum) {
    try {
      const publicClient = createPublicClient({
        chain: celo,
        transport: custom(window.ethereum),
      });
      try {
        const userIsWhitelisted =
          await publicClient.readContract({
            address: _surveyContractAddress,
            abi: closedSurveyV3ContractABI,
            functionName: "checkIfParticipantIsScreened",
            args: [_participantWalletAddress],
          });
        return userIsWhitelisted as boolean;
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
};
