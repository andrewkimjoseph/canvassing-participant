// src/index.ts
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { TempSignForClaimingResult, TempSignForScreeningProps, WebhookPayload } from './types/types';
import { processWebhook } from './utils/tallyForms/webhookProcessor';
import { tempSignForScreening } from './utils/tempSignForScreening';

/**
 * HTTP Cloud Function that processes a webhook request to create an unclaimed reward upon submission for the mainnet.
 *
 * @function
 * @name createUnclaimedRewardUponSubmissionV2Mainnet
 * @param {functions.https.Request} request - The HTTP request object.
 * @param {functions.Response} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 * @throws {Error} - Throws an error if the processing fails.
 *
 */
export const createUnclaimedRewardUponSubmissionV2Mainnet = functions.https.onRequest(
  async (request, response) => {
    try {
      await processWebhook(request.body.data, 'mainnet');
      console.log('Process completed successfully.');
      response.status(200).send('Process completed successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);

/**
 * HTTP Cloud Function that processes a webhook request to create an unclaimed reward upon submission for the mainnet (1).
 *
 * @function
 * @name createUnclaimedRewardUponSubmissionV2Mainnet1
 * @param {functions.https.Request} request - The HTTP request object.
 * @param {functions.Response} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 * @throws {Error} - Throws an error if the processing fails.
 *
 */
export const createUnclaimedRewardUponSubmissionV2Mainnet1 = functions.https.onRequest(
  async (request, response) => {
    try {
      await processWebhook(request.body.data, 'mainnet');
      console.log('Process completed successfully.');
      response.status(200).send('Process completed successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);


/**
 * HTTP Cloud Function that processes a webhook request to create an unclaimed reward upon submission for the mainnet (2).
 *
 * @function
 * @name createUnclaimedRewardUponSubmissionV2Mainnet2
 * @param {functions.https.Request} request - The HTTP request object.
 * @param {functions.Response} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 * @throws {Error} - Throws an error if the processing fails.
 *
 */
export const createUnclaimedRewardUponSubmissionV2Mainnet2 = functions.https.onRequest(
  async (request, response) => {
    try {
      await processWebhook(request.body.data, 'mainnet');
      console.log('Process completed successfully.');
      response.status(200).send('Process completed successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);

/**
 * HTTP Cloud Function that processes a webhook request to create an unclaimed reward upon submission for the mainnet (3).
 *
 * @function
 * @name createUnclaimedRewardUponSubmissionV2Mainnet3
 * @param {functions.https.Request} request - The HTTP request object.
 * @param {functions.Response} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 * @throws {Error} - Throws an error if the processing fails.
 *
 */
export const createUnclaimedRewardUponSubmissionV2Mainnet3 = functions.https.onRequest(
  async (request, response) => {
    try {
      await processWebhook(request.body.data, 'mainnet');
      console.log('Process completed successfully.');
      response.status(200).send('Process completed successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);

/**
 * HTTP Cloud Function that processes a webhook request to create an unclaimed reward upon submission for the testnet.
 *
 * @function
 * @name createUnclaimedRewardUponSubmissionV2Testnet
 * @param {functions.https.Request} request - The HTTP request object.
 * @param {functions.Response} response - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 * @throws {Error} - Throws an error if the processing fails.
 *
 */
export const createUnclaimedRewardUponSubmissionV2Testnet = functions.https.onRequest(
  async (request, response) => {
    try {
      await processWebhook(request.body.data, 'testnet');
      console.log('Process completed successfully.');
      response.status(200).send('Process completed successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);



// LEGACY FUNCTION - Consider moving to separate file if needed
export const createUnclaimedRewardUponFormSubmission = functions.https.onRequest(
  async (request, response) => {
    try {
      const webhookPayload = request.body as WebhookPayload;
      const data = webhookPayload.data;

      const walletAddressField = data.fields.find(
        (field) => field.label === 'walletAddress'
      );
      const walletAddress: string | null = walletAddressField
        ? (walletAddressField.value as string)
        : null;

      const surveyIdField = data.fields.find(
        (field) => field.label === 'surveyId'
      );
      const surveyId: string | null = surveyIdField
        ? (surveyIdField.value as string)
        : null;

      if (!walletAddress || !surveyId) {
        response
          .status(400)
          .send('Missing wallet address or survey ID in form submission.');
        return;
      }

      const participantSnapshot = await admin.firestore()
        .collection('participants')
        .where('walletAddress', '==', walletAddress)
        .limit(1)
        .get();
        
      if (participantSnapshot.empty) {
        response
          .status(400)
          .send('Participant not found for the given wallet address.');
        return;
      }
      
      const participantId = participantSnapshot.docs[0].id;

      const rewardDoc = admin.firestore().collection('rewards').doc();
      await rewardDoc.set({
        id: rewardDoc.id,
        surveyId,
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

      console.log('Reward document created:', rewardDoc.id);
      response.status(200).send('Reward document created successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  }
);
/**
 * Callable Cloud Function that generates a signature for participant screening.
 * 
 * @function
 * @name generateScreeningSignature
 * @param {functions.https.CallableRequest<any>} request - The callable request object.
 * @param {functions.https.CallableResponse<TempSignForClaimingResult>} response - The callable response object.
 * @returns {Promise<TempSignForClaimingResult>} - A promise that resolves with the signature result.
 * @throws {functions.https.HttpsError} - Throws an error if the parameters are invalid or the signing fails.
 */
export const generateScreeningSignature = functions.https.onCall(
  async (request: functions.https.CallableRequest<any>): Promise<TempSignForClaimingResult> => {
    try {
      const data = request.data as TempSignForScreeningProps;
  
      // Validate required parameters
      if (!data.surveyContractAddress || 
          !data.chainId || 
          !data.participantWalletAddress || 
          !data.surveyId || 
          !data.network) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters for signature generation'
        );
      }

      if (!request.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'The function must be called while authenticated.'
        );
      }

      // Generate the signature
      const result = await tempSignForScreening({
        surveyContractAddress: data.surveyContractAddress,
        chainId: data.chainId,
        participantWalletAddress: data.participantWalletAddress,
        surveyId: data.surveyId,
        network: data.network
      });

      console.log('Signature generation completed:', result.success);
      
      return result;
    } catch (error) {
      console.error('Error generating signature:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate signature',
        error
      );
    }
  }
);