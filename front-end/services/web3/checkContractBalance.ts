import { cUSDContractABI } from '@/utils/abis/cUSDContractABI';
import { cUSDAlfajoresContractAddress } from '@/utils/addresses/cUSDAlfajoresContractAddress';
// import { cUSDAlfajoresContractAddress } from "@/utils/addresses/cUSDAlfajoresContractAddress";
import { cUSDMainnetContractAddress } from '@/utils/addresses/cUSDMainnetContractAddress';
import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';
// import { celo } from "viem/chains";

export const getContractBalance = async (
  _signerAddress: `0x${string}` | undefined,
  { _contractAddress, _chainId }: GetContractBalanceProps
): Promise<number> => {
  let contractBalance: number = 0;
  if (window.ethereum) {
    try {
      const publicClient = createPublicClient({
        chain: _chainId === celo.id ? celo : celoAlfajores,
        transport: custom(window.ethereum),
      });
      contractBalance = Number(
        (await publicClient.readContract({
          address:
            _chainId === celo.id
              ? cUSDMainnetContractAddress
              : cUSDAlfajoresContractAddress,
          abi: cUSDContractABI,
          functionName: 'balanceOf',
          args: [_contractAddress],
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
  _chainId: number;
};
