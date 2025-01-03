import * as admin from 'firebase-admin';
import { WebhookData } from '../types/types';

admin.initializeApp();

const firestore = admin.firestore();

export const createRewardDocument = async (
  data: WebhookData,
  participantId: string,
  walletAddress: string,
) => {
  const rewardDoc = firestore.collection('rewards').doc();
  await rewardDoc.set({
    id: rewardDoc.id,
    surveyId: data.fields.find(field => field.label === 'surveyId')?.value,
    participantId,
    respondentId: data.respondentId,
    formId: data.formId,
    submissionId: data.submissionId,
    isClaimed: false,
    participantWalletAddress: walletAddress,
    responseId: data.responseId,
    timeCreated: admin.firestore.FieldValue.serverTimestamp(),
    timeUpdated: null,
    transactionHash: null,
    amountIncUSD: null,
  });
  return rewardDoc.id;
};


export const updateRewardWhitelistingTransactionHash = async (
  rewardId: string,
  whitelistingTransactionHash: string
) => {
  const rewardDoc = firestore.collection('rewards').doc(rewardId);
  await rewardDoc.update({
    whitelistingTransactionHash: whitelistingTransactionHash,
    timeUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Reward doc updated', rewardId);
};