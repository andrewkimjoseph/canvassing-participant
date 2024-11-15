import * as admin from 'firebase-admin';


export interface Survey {
    id: string;
    researcherId: string | null;
    topic: string | null;
    brief: string | null;
    instructions: string | null;
    durationInMinutes: number | null;
    formLink: string | null;
    rewardAmountIncUSD: number | null;
    smartContractAddress: string | null;
    isAvailable: boolean | null;
    timeCreated: admin.firestore.Timestamp | null
  }