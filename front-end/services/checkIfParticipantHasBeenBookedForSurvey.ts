import { checkIfParticipantIsScreenedInBC } from './web3/checkIfParticipantIsScreenedInBC';
import { Address } from 'viem';
import { checkIfParticipantIsScreenedInDB } from './db/checkIfParticipantIsScreenedInDB';

export const checkIfParticipantIsScreenedForSurvey = async ({
  _participantId,
  _participantWalletAddress,
  _surveyId,
  _surveyContractAddress,
  _chainId,
}: CheckIfParticipantIsScreenedForSurveyProps): Promise<boolean> => {
  const participantIsScreenedBC = await checkIfParticipantIsScreenedInBC({
    _participantWalletAddress: _participantWalletAddress as Address,
    _surveyContractAddress: _surveyContractAddress as Address,
    _chainId: _chainId,
  });

  const participantIsScreenedDB = await checkIfParticipantIsScreenedInDB({
    _participantId: _participantId,
    _participantWalletAddress: _participantWalletAddress,
    _surveyId: _surveyId,
  });

  if (participantIsScreenedBC) {
    return true;
  }
  return participantIsScreenedDB;
};

export type CheckIfParticipantIsScreenedForSurveyProps = {
  _participantWalletAddress: string;
  _participantId: string;
  _surveyId: string;
  _surveyContractAddress: string;
  _chainId: number;
};
