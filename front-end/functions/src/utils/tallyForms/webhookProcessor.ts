
import * as admin from 'firebase-admin';
import { WebhookData } from '../../types/types';
import { createRewardDocument, updateRewardSignature } from '../db';
import { signForReward } from '../web3';
import { Address } from 'viem';

const firestore = admin.firestore();

const extractFormData = (data: WebhookData) => {
  const walletAddressField = data.fields.find(
    (field) => field.label === 'walletAddress'
  );
  const surveyIdField = data.fields.find(
    (field) => field.label === 'surveyId'
  );

  return {
    walletAddress: walletAddressField ? (walletAddressField.value as string) : null,
    surveyId: surveyIdField ? (surveyIdField.value as string) : null,
  };
};

export const processWebhook = async (
  data: WebhookData,
  network: 'mainnet' | 'testnet'
) => {
  const { walletAddress, surveyId } = extractFormData(data);
  
  if (!walletAddress || !surveyId) {
    throw new Error('Missing wallet address or survey ID in form submission.');
  }

  const participantSnapshot = await firestore
    .collection('participants')
    .where('walletAddress', '==', walletAddress)
    .limit(1)
    .get();
  
  if (participantSnapshot.empty) {
    throw new Error('Participant not found for the given wallet address.');
  }

  const surveySnapshot = await firestore
    .collection('surveys')
    .where('id', '==', surveyId)
    .limit(1)
    .get();

  if (surveySnapshot.empty) {
    throw new Error('Survey not found.');
  }

  const participantId = participantSnapshot.docs[0].id;

  const rewardId = await createRewardDocument(data, participantId, walletAddress);
  console.log('Reward document created:', rewardId);

  const signForRewardResult = await signForReward(
  {
    participantWalletAddress: walletAddress as Address,
    rewardId: rewardId,
    network: network
  }
  );

  if (!signForRewardResult.success) {
    throw new Error('[FATAL] Whitelisting failed.');
  }

  await updateRewardSignature({
    signature: signForRewardResult.signature,
    rewardId: rewardId,
    nonce: signForRewardResult.nonce
  });

  return signForRewardResult;
};
