import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const checkIfParticipantHasCompletedSurvey = async ({
  _participantId,
  _participantWalletAddress,
  _surveyId,
}: CheckIfParticipantHasCompletedSurveyProps): Promise<boolean> => {
  let participantHasCompletedSurvey: boolean = true;

  const rewardsQuery = query(
    collection(db, 'rewards'),
    where('participantWalletAddress', '==', _participantWalletAddress),
    where('surveyId', '==', _surveyId)
  );
  const snapshot = await getDocs(rewardsQuery);

  return snapshot.empty ? !participantHasCompletedSurvey : participantHasCompletedSurvey;
};

export type CheckIfParticipantHasCompletedSurveyProps = {
  _participantWalletAddress: string;
  _participantId: string;
  _surveyId: string;
};
