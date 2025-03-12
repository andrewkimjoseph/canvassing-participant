import { RewardToken } from '@/types/rewardToken';
import { erc20TokenABI } from '@/utils/abis/erc20Token';
import { 
  cUSDAlfajoresContractAddress, 
  cUSDMainnetContractAddress,
  goodDollarMainnetContractAddress,
   
} from '@/utils/addresses/tokens';
import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const getTokenContractBalance = async (
  _signerAddress: `0x${string}` | undefined,
  { _contractAddress, _chainId, _token }: GetContractBalanceProps
): Promise<number> => {
  let contractBalance: number = 0;
  if (window.ethereum) {
    try {
      const publicClient = createPublicClient({
        chain: _chainId === celo.id ? celo : celoAlfajores,
        transport: custom(window.ethereum),
      });

      // Determine which token address to use
      let tokenAddress: Address;
      if (_token === RewardToken.goodDollar) {
        // GoodDollar is not on mainnet, so we use its specific address
        tokenAddress = goodDollarMainnetContractAddress;
      } else {
        // Default to cUSD
        tokenAddress = _chainId === celo.id 
          ? cUSDMainnetContractAddress 
          : cUSDAlfajoresContractAddress;
      }

      contractBalance = Number(
        (await publicClient.readContract({
          address: tokenAddress,
          abi: erc20TokenABI, // Using the same ABI for all ERC20 tokens
          functionName: 'balanceOf',
          args: [_contractAddress],
        })) ?? 0
      );

      return contractBalance;
    } catch (error) {
      console.error("Error fetching contract balance:", error);
      return contractBalance;
    }
  }
  return contractBalance;
};

export type GetContractBalanceProps = {
  _contractAddress: Address;
  _chainId: number;
  _token: RewardToken;
};