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

export interface WhitelistParticipantResult {
  success: boolean;
  txnHash: Address | null;
}