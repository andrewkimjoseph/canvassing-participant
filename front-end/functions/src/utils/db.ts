import * as admin from 'firebase-admin';
import {
  CreateRewardProps,
  CreateRewardResult,
  Reward,
  UpdateRewardSignatureProps,
} from '../types/types';

admin.initializeApp();

const firestore = admin.firestore();

/**
 * Creates a reward document in the Firestore database.
 * 
 * This function checks if a reward document already exists for the given surveyId and participantId.
 * If it exists, it returns the existing reward document. Otherwise, it creates a new reward document.
 * 
 * @param {CreateRewardProps} params - The parameters for creating the reward document.
 * @param {object} params.data - The data object containing fields and other information.
 * @param {string} params.participantId - The ID of the participant.
 * @param {string} params.walletAddress - The wallet address of the participant.
 * 
 * @returns {Promise<CreateRewardResult>} - A promise that resolves to an object containing the rewardId, signature, and a boolean indicating if the reward already existed.
 * 
 * @throws {Error} - Throws an error if there is an issue with Firestore operations.
 */
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

/**
 * Updates the reward document with a new signature and nonce if they are not already present.
 * If the reward already has a signature and nonce, it logs the existing values.
 * Otherwise, it updates the reward document with the new signature, nonce, and the current server timestamp.
 * 
 * @param {Object} params - The parameters for updating the reward signature.
 * @param {string} params.signature - The new signature to be added to the reward.
 * @param {string} params.nonce - The new nonce to be added to the reward.
 * @param {string} params.rewardId - The ID of the reward document to be updated.
 * 
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
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
