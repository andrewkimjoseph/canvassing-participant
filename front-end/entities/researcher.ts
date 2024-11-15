
import * as admin from 'firebase-admin';

export interface Researcher {
    country: string;
    id: string;
    name: string;
    walletAddress: string;
    timeCreated: admin.firestore.Timestamp;
  }
  