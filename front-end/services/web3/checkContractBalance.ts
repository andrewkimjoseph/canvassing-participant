
import { cUSDContractABI } from "@/utils/abis/cUSDContractABI";
// import { cUSDAlfajoresContractAddress } from "@/utils/addresses/cUSDAlfajoresContractAddress";
import { cUSDMainnetContractAddress } from "@/utils/addresses/cUSDMainnetContractAddress";
import { Address, createPublicClient, custom } from "viem";
// import { celoAlfajores } from "viem/chains";
import { celo } from "viem/chains";

export const getContractBalance = async (
  _signerAddress: `0x${string}` | undefined,
  { _contractAddress: contractAddress }: GetContractBalanceProps
): Promise<number> => {
  let contractBalance: number = 0;
  if (window.ethereum) {
    try {
      const publicClient = createPublicClient({
        chain: celo,
        transport: custom(window.ethereum),
      });
      contractBalance = Number(
        (await publicClient.readContract({
          address: cUSDMainnetContractAddress,
          abi: cUSDContractABI,
          functionName: "balanceOf",
          args: [contractAddress],
        })) ?? 0
      );

      return contractBalance;
    } catch (error) {
      return contractBalance;
    }
  }
  return contractBalance;
};

export type GetContractBalanceProps = {
    _contractAddress: Address;
};