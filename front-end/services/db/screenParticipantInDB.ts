import { Participant } from '@/entities/participant';
import { Screening } from '@/entities/screening';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import {
  collection,
  doc,
  Timestamp,
  setDoc
} from 'firebase/firestore';

export const screenParticipantInDB = async ({
  _participant,
  _survey,
  _transactionHash
}: ScreenParticipantInDBProps): Promise<boolean> => {
  let success: boolean = false;

  try {
    const screeningId = doc(collection(db, 'screenings')).id;
    const screeningRef = doc(db, 'screenings', screeningId);

    const data = {
      id: screeningId,
      participantWalletAddress: _participant.walletAddress,
      participantId: _participant.id,
      surveyId: _survey.id,
      timeCreated: Timestamp.now(),
      transactionHash: _transactionHash,
    };

    await setDoc(screeningRef, data);

    success = true;

    return success;
  } catch (error) {

    console.log(error);
    return success;
  }
};

export type ScreenParticipantInDBProps = {
  _participant: Participant;
  _survey: Survey;
  _transactionHash: string;
};
