import { closedSurveyV5ContractABI } from '@/utils/abis/closedSurveyV4ContractABI';
import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const checkIfSurveyIsAtMaxParticipants = async ({
  _surveyContractAddress,
  _chainId,
}: CheckIfSurveyIsFullyBookedProps): Promise<boolean> => {
  try {
    const publicClient = createPublicClient({
      chain: _chainId === celo.id ? celo : celoAlfajores,
      transport: custom(window.ethereum),
    });

    // Get the number of target participants
    const numberOfTargetParticipants = Number(
      (await publicClient.readContract({
        address: _surveyContractAddress,
        abi: closedSurveyV5ContractABI,
        functionName: 'getTargetNumberOfParticipants',
      })) ?? 0
    );

    // Get the number of screened participants
    const numberOfRewardedParticipants = Number(
      (await publicClient.readContract({
        address: _surveyContractAddress,
        abi: closedSurveyV5ContractABI,
        functionName: 'getNumberOfRewardedParticipants',
      })) ?? 0
    );

    return numberOfRewardedParticipants >= numberOfTargetParticipants;
  } catch (error) {
    return false;
  }
};

export type CheckIfSurveyIsFullyBookedProps = {
  _surveyContractAddress: Address;
  _chainId: number;
};
