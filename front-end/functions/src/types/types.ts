import { Address } from 'viem';
import admin from 'firebase-admin';

export interface FormField {
  key: string;
  label: string;
  type: string;
  value: string | string[];
}

export interface WebhookData {
  responseId: string;
  submissionId: string;
  respondentId: string;
  formId: string;
  formName: string;
  createdAt: string;
  fields: FormField[];
}

export interface WebhookPayload {
  data: WebhookData;
}

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
  isAlreadyBookedByUser: boolean | null;
  isTest: boolean | null;
}

export interface SignForRewardProps {
  participantWalletAddress: Address;
  rewardId: string;
  network: 'mainnet' | 'testnet';
}

export interface SignForRewardResult {
  success: boolean;
  signature: Address | null;
  nonce: string;
}

export interface UpdateRewardSignatureProps {
  signature: Address | null;
  rewardId: string;
  nonce: string;
}

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
}
