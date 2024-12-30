import * as admin from 'firebase-admin';
import { Address } from 'viem';


export interface Survey {
    id: string;
    researcherId: string | null;
    topic: string | null;
    brief: string | null;
    instructions: string | null;
    durationInMinutes: number | null;
    formLink: string | null;
    rewardAmountIncUSD: number | null;
    contractAddress: Address | null;
    isAvailable: boolean | null;
    timeCreated: admin.firestore.Timestamp | null;
    targetCountry: string | null;
    targetGender: string | null;
  }