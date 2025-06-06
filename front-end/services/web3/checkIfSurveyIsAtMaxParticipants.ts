import { closedSurveyV6ContractABI } from '@/utils/abis/closedSurveyV6ContractABI';
import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const checkIfSurveyIsFullyBooked = async ({
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
        abi: closedSurveyV6ContractABI,
        functionName: 'getTargetNumberOfParticipants',
      })) ?? 0
    );

    // Get the number of screened participants
    const numberOfScreenedParticipants = Number(
      (await publicClient.readContract({
        address: _surveyContractAddress,
        abi: closedSurveyV6ContractABI,
        functionName: 'getNumberOfScreenedParticipants',
      })) ?? 0
    );

    return numberOfScreenedParticipants >= numberOfTargetParticipants;
  } catch (error) {
    return false;
  }
};

export type CheckIfSurveyIsFullyBookedProps = {
  _surveyContractAddress: Address;
  _chainId: number;
};
