
import * as admin from 'firebase-admin';

export interface Participant {
    country: string;
    id: string;
    gender: string;
    username: string;
    walletAddress: string;
    timeCreated: admin.firestore.Timestamp;
  }
  