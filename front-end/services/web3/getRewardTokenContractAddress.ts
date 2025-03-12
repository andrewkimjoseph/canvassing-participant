import { RewardToken } from "@/types/rewardToken";
import { closedSurveyV6ContractABI } from "@/utils/abis/closedSurveyV6ContractABI";
import {
  cUSDMainnetContractAddress,
  goodDollarMainnetContractAddress,
} from "@/utils/addresses/tokens";
import { Address, createPublicClient, custom } from "viem";
import { celoAlfajores, celo } from "viem/chains";

export const getRewardTokenForSurvey = async ({
  _surveyContractAddress,
  _chainId,
}: GetRewardTokenForSurveyProps): Promise<RewardToken> => {
  let rewardToken: RewardToken = RewardToken.celoDollar;

  try {
    const publicClient = createPublicClient({
      chain: _chainId === celo.id ? celo : celoAlfajores,
      transport: custom(window.ethereum),
    });

    const rewardTokenContractAddress = (await publicClient.readContract({
      address: _surveyContractAddress,
      abi: closedSurveyV6ContractABI,
      functionName: "getRewardTokenContractAddress",
    })) as Address;

    if (rewardTokenContractAddress === goodDollarMainnetContractAddress) {
      rewardToken = RewardToken.goodDollar;
    }

    return rewardToken;
  } catch (error) {
    return rewardToken;
  }
};

export type GetRewardTokenForSurveyProps = {
  _surveyContractAddress: Address;
  _chainId: number;
};
