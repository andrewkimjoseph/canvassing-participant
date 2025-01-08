import * as admin from 'firebase-admin';
import { Survey, WebhookData } from '../../types/types';
import { createRewardDocument, updateRewardSignature } from '../db';
import { signForReward } from '../web3';
import { Address } from 'viem';
import { CHAIN_CONFIGS } from '../../config/config';

const firestore = admin.firestore();

const extractFormData = (data: WebhookData) => {
  const walletAddressField = data.fields.find(
    (field) => field.label === 'walletAddress'
  );
  const surveyIdField = data.fields.find((field) => field.label === 'surveyId');

  return {
    walletAddress: walletAddressField
      ? (walletAddressField.value as string)
      : null,
    surveyId: surveyIdField ? (surveyIdField.value as string) : null,
  };
};

export const processWebhook = async (
  data: WebhookData,
  network: 'mainnet' | 'testnet'
) => {
  const { walletAddress, surveyId } = extractFormData(data);

  const chainConfig = CHAIN_CONFIGS[network];

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

  const survey =  surveySnapshot.docs[0].data() as Survey;

  const participantId = participantSnapshot.docs[0].id;

  const rewardCreationResult = await createRewardDocument({
    data,
    participantId,
    walletAddress,
  });

  if (rewardCreationResult.signature && rewardCreationResult.alreadyExisted) {
    return;
  }

  const signForRewardResult = await signForReward({
    surveyContractAddress: survey.contractAddress as Address,
    chainId: chainConfig.id,
    participantWalletAddress: walletAddress as Address,
    rewardId: rewardCreationResult.rewardId,
    network: network,
  });

  if (!signForRewardResult.success) {
    throw new Error('[FATAL] Signing failed.');
  }

  await updateRewardSignature({
    signature: signForRewardResult.signature,
    rewardId: rewardCreationResult.rewardId,
    nonce: signForRewardResult.nonce,
  });
};
