import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const checkIfParticipantIsScreenedInDB = async ({
  _participantId,
  _participantWalletAddress,
  _surveyId,
}: CheckIfParticipantIsScreenedPropsInDB): Promise<boolean> => {
  let participantIsScreened: boolean = false;

  const screeningsQuery = query(
    collection(db, 'screenings'),
    where('participantId', '==', _participantId),
    where('participantWalletAddress', '==', _participantWalletAddress),
    where('surveyId', '==', _surveyId)
  );
  const snapshot = await getDocs(screeningsQuery);

  return snapshot.empty ? participantIsScreened : !participantIsScreened;
};

export type CheckIfParticipantIsScreenedPropsInDB = {
  _participantWalletAddress: string;
  _participantId: string;
  _surveyId: string;
};
