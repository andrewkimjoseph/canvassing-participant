import * as admin from 'firebase-admin';
import { Survey, WebhookData } from '../../types/types';
import { createRewardDocument, updateRewardSignature } from '../db';
import { signForReward } from '../signForClaiming';
import { Address } from 'viem';
import { CHAIN_CONFIGS } from '../../config/config';

const firestore = admin.firestore();

/**
 * Extracts specific form data from a given WebhookData object.
 *
 * @param {WebhookData} data - The data object containing form fields.
 * @returns {Object} An object containing the extracted form data:
 * - `walletAddress` (string | null): The wallet address from the form, or null if not found.
 * - `surveyId` (string | null): The survey ID from the form, or null if not found.
 * - `participantId` (string | null): The participant ID from the form, or null if not found.
 * - `gender` (string | null): The gender from the form, or null if not found.
 * - `country` (string | null): The country from the form, or null if not found.
 * - `researcherId` (string | null): The researcher ID from the form, or null if not found.
 * - `contractAddress` (string | null): The contract address from the form, or null if not found.
 * - `authId` (string | null): The auth ID from the form, or null if not found.
 */
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

/**
 * Processes a webhook by extracting form data, validating required fields,
 * checking participant and survey existence, creating a reward document,
 * signing for the reward, and updating the reward signature.
 *
 * @param data - The webhook data to process.
 * @param network - The network to use, either 'mainnet' or 'testnet'.
 * @throws Will throw an error if any required fields are missing, if the participant or survey is not found, or if signing fails.
 */
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
  } = extractFormData(data);
  const chainConfig = CHAIN_CONFIGS[network];

  if (
    !walletAddress ||
    !surveyId ||
    !participantId ||
    !gender ||
    !country ||
    !researcherId ||
    !contractAddress
  ) {
    const missingFields = [];
    if (!walletAddress) missingFields.push('wallet address');
    if (!surveyId) missingFields.push('survey ID');
    if (!participantId) missingFields.push('participant ID');
    if (!gender) missingFields.push('gender');
    if (!country) missingFields.push('country');
    if (!researcherId) missingFields.push('researcher ID');
    if (!contractAddress) missingFields.push('contract address');

    throw new Error(
      `Missing required fields in form submission: ${missingFields.join(', ')}.`
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
    contractAddress: survey.contractAddress as Address,
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
