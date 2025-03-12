import { RPCUrls } from "@/utils/rpcURLs/rpcUrls";
import { Address, createPublicClient, http } from "viem";
import { celoAlfajores, celo } from "viem/chains";

/**
 * Checks if a contract address is deployed on the Celo Alfajores testnet
 * @param _contractAddress The contract address to check
 * @returns A boolean indicating if the contract exists on testnet
 */
export const checkIfSurveyIsForTestnet = async ({
  _contractAddress,
}: CheckIfSurveyIsForTestnetProps): Promise<boolean> => {
  try {
    // Create a client for the testnet
    const testnetClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(RPCUrls.celoAlfajores()),
    });

    // Check if the contract exists on testnet by getting its code
    const contractCode = await testnetClient.getCode({
      address: _contractAddress as Address,
    });
    // If contractCode exists and is not '0x' (empty), the contract exists on testnet

    return !!contractCode && contractCode !== "0x";
  } catch (error) {
    console.error("Error checking if contract is on testnet:", error);
    return false;
  }
};

export type CheckIfSurveyIsForTestnetProps = {
  _contractAddress: string;
};
