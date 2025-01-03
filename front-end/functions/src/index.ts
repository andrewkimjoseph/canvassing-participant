// src/index.ts
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { WebhookPayload } from './types/types';
import { processWebhook } from './utils/tallyForms/webhookProcessor';

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