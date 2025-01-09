import * as admin from 'firebase-admin';
import {
  CreateRewardProps,
  CreateRewardResult,
  Reward,
  UpdateRewardSignatureProps,
} from '../types/types';

admin.initializeApp();

const firestore = admin.firestore();

export const createRewardDocument = async ({
  data,
  participantId,
  walletAddress,
}: CreateRewardProps): Promise<CreateRewardResult> => {
  let reward: Reward | null = null;
  let signature: string | null = null;
  let alreadyExisted: boolean = false;


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
      signature: null,
      nonce: null
    });

    reward = (await rewardDoc.get()).data() as Reward;
    signature = reward.signature;
    alreadyExisted = false;
    console.log('New reward created:', reward);

  } else {
    reward = existingReward.docs[0].data() as Reward;
    signature = reward.signature;
    alreadyExisted = true;
    console.log('Existing reward found:', reward);
  }

  return {
    rewardId: reward.id,
    signature: signature,
    alreadyExisted
  };
};

export const updateRewardSignature = async ({
  signature,
  nonce,
  rewardId,
}: UpdateRewardSignatureProps) => {
  const rewardDoc = firestore.collection('rewards').doc(rewardId);

  const reward = (await rewardDoc.get()).data() as Reward;

  if (reward.signature && reward.nonce) {
    console.log('Reward already updated ...', rewardId);
    console.log('Signature:', reward.signature);
    console.log('Nonce:', reward.nonce);
  } else {
    await rewardDoc.update({
      signature: signature,
      timeUpdated: admin.firestore.FieldValue.serverTimestamp(),
      nonce: nonce,
    });

    const updatedReward = (await rewardDoc.get()).data() as Reward;

    console.log('Old reward being updated ...');
    console.log('Old reward updated:', updatedReward);
  }
};
