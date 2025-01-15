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
  const participantIdField = data.fields.find(
    (field) => field.label === 'participantId'
  );
  const genderField = data.fields.find((field) => field.label === 'gender');
  const countryField = data.fields.find((field) => field.label === 'country');
  const researcherIdField = data.fields.find(
    (field) => field.label === 'researcherId'
  );
  const contractAddressField = data.fields.find(
    (field) => field.label === 'contractAddress'
  );

  const authIdField = data.fields.find(
    (field) => field.label === 'authId'
  );

  const returnData = {
    walletAddress: walletAddressField
      ? (walletAddressField.value as string)
      : null,
    surveyId: surveyIdField ? (surveyIdField.value as string) : null,
    participantId: participantIdField
      ? (participantIdField.value as string)
      : null,
    gender: genderField ? (genderField.value as string) : null,
    country: countryField ? (countryField.value as string) : null,
    researcherId: researcherIdField
      ? (researcherIdField.value as string)
      : null,
    contractAddress: contractAddressField
      ? (contractAddressField.value as string)
      : null,
      authId: authIdField
      ? (authIdField.value as string)
      : null,
  };

  console.log('Extracted data:', returnData);

  return returnData;
};

export const processWebhook = async (
  data: WebhookData,
  network: 'mainnet' | 'testnet'
) => {
  const {
    walletAddress,
    surveyId,
    participantId,
    gender,
    country,
    researcherId,
    contractAddress,
    authId
  } = extractFormData(data);
  const chainConfig = CHAIN_CONFIGS[network];

  if (
    !walletAddress ||
    !surveyId ||
    !participantId ||
    !gender ||
    !country ||
    !researcherId ||
    !contractAddress ||
    !authId
  ) {
    throw new Error(
      'Missing required fields in form submission: wallet address, survey ID, participant ID, gender, country, researcher ID, or contract address.'
    );
  }

  const participant = await firestore
    .collection('participants')
    .doc(participantId as string)
    .get();

  if (!participant.exists) {
    throw new Error('Participant not found.');
  }

  const surveySnapshot = await firestore
    .collection('surveys')
    .doc(surveyId as string)
    .get();

  if (!surveySnapshot.exists) {
    throw new Error('Survey not found.');
  }

  const survey = surveySnapshot.data() as Survey;

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
