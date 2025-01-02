import { Participant } from '@/entities/participant';
import { Screening } from '@/entities/screening';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export const screenParticipantInDB = async ({
  _participant,
  _survey,
  _transactionHash
}: ScreenParticipantInDBProps): Promise<boolean> => {
  let success: boolean = false;

  try {
    const screeningRef = collection(db, 'screenings');

    const screening: Screening = {
      id: screeningRef.id,
      participantWalletAddress: _participant.walletAddress,
      participantId: _participant.id,
      surveyId: _survey.id,
      timeCreated: Timestamp.now(),
      transactionHash: _transactionHash,
    };
    await addDoc(screeningRef, {
      ...screening,
    });

    success = true;

    return success;
  } catch (error) {
    return success;
  }
};

export type ScreenParticipantInDBProps = {
  _participant: Participant;
  _survey: Survey;
  _transactionHash: string;
};
