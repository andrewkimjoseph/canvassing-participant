
import * as admin from 'firebase-admin';

export interface Screening {
    id: string;
    participantWalletAddress: string | null;
    participantId: string | null;
    surveyId: string | null;
    timeCreated: admin.firestore.Timestamp;
  }
  