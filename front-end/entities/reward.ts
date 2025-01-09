import * as admin from 'firebase-admin';
import { Address } from 'viem';

export interface Reward {
  id: string;
  surveyId: string | null;
  participantId: string | null;
  respondentId: string | null;
  formId: string | null;
  submissionId: string | null;
  isClaimed: boolean;
  participantWalletAddress: string | null;
  responseId: string | null;
  timeCreated: admin.firestore.Timestamp | null;
  timeUpdated: admin.firestore.Timestamp | null;
  transactionHash: string | null;
  amountIncUSD: number | null;
  signature: Address | null;
  nonce: string | null;
  isForTestnet: boolean | null;
}
