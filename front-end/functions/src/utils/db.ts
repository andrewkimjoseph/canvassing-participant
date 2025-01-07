import * as admin from 'firebase-admin';
import {
  Reward,
  UpdateRewardSignatureProps,
  WebhookData,
} from '../types/types';

admin.initializeApp();

const firestore = admin.firestore();

export const createRewardDocument = async (
  data: WebhookData,
  participantId: string,
  walletAddress: string
): Promise<string> => {
  let rewardId: string | null = null;

  const surveyId = data.fields.find(
    (field) => field.label === 'surveyId'
  )?.value;

  const existingReward = await firestore
    .collection('rewards')
    .where('surveyId', '==', surveyId)
    .where('participantId', '==', participantId)
    .get();

  if (existingReward.empty) {
    console.log('New reward being created ...');
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

    console.log('Existing reward, [id] being returned ...:', rewardId);
  }

  return rewardId;
};

export const updateRewardSignature = async ({
  signature,
  nonce,
  rewardId,
}: UpdateRewardSignatureProps) => {
  const rewardDoc = firestore.collection('rewards').doc(rewardId);

  const reward = (await rewardDoc.get()).data() as Reward;

  if (reward.signature && reward.nonce) {
    console.log('Reward doc already updated:', rewardId);
    console.log('Signature:', reward.signature);
    console.log('Nonce:', reward.nonce);
  } else {
    await rewardDoc.update({
      signature: signature,
      timeUpdated: admin.firestore.FieldValue.serverTimestamp(),
      nonce: nonce,
    });

    console.log('Signature:', signature);
    console.log('Nonce:', nonce);

    console.log('Reward doc updated:', rewardId);
  }
};
