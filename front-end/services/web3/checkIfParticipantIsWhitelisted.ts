import { closedSurveyV3ContractABI } from "@/utils/abis/closedSurveyV3ContractABI";
import { Address, createPublicClient, custom } from "viem";
// import { celoAlfajores } from "viem/chains";
import { celo } from "viem/chains";

export const checkIfParticipantIsWhitelisted = async (
  _signerAddress: `0x${string}` | undefined,
  {
    _walletAddress,
    _contractAddress
  }: CheckIfUserAddressIsWhitelistedProps
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
            address: _contractAddress,
            abi: closedSurveyV3ContractABI,
            functionName: "checkIfParticipantIsWhitelisted",
            args: [_walletAddress],
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

export type CheckIfUserAddressIsWhitelistedProps = {
  _walletAddress: Address;
  _contractAddress: Address;
};
