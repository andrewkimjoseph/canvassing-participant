import * as admin from 'firebase-admin';
import { Reward, WebhookData } from '../types/types';

admin.initializeApp();

const firestore = admin.firestore();

export const createRewardDocument = async (
  data: WebhookData,
  participantId: string,
  walletAddress: string
): Promise<string> => {
  let rewardId: string | null = null;

  const existingReward = await firestore
    .collection('rewards')
    .where(
      'surveyId',
      '==',
      data.fields.find((field) => field.label === 'surveyId')?.value
    )
    .where('participantId', '==', participantId)
    .where('respondentId', '==', data.respondentId)
    .where('formId', '==', data.formId)
    .where('submissionId', '==', data.submissionId)
    .get();

  if (existingReward.empty) {
    const rewardDoc = firestore.collection('rewards').doc();

    await rewardDoc.set({
      id: rewardDoc.id,
      surveyId: data.fields.find((field) => field.label === 'surveyId')?.value,
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

    rewardId = rewardDoc.id;
  } else {
    let reward = existingReward.docs[0].data() as Reward;
    rewardId = reward.id;
  }

  return rewardId;
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

  console.log('Reward doc updated:', rewardId);
};
