import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
admin.initializeApp();
const firestore = admin.firestore();

interface FormField {
  key: string;
  label: string;
  type: string;
  value: string | string[];
}

interface WebhookData {
  responseId: string;
  submissionId: string;
  respondentId: string;
  formId: string;
  formName: string;
  createdAt: string;
  fields: FormField[];
}

interface WebhookPayload {
  data: WebhookData;
}

export const createUnclaimedRewardUponFormSubmission =
  functions.https.onRequest(async (request, response) => {
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

      // Fetch participant ID from the "participants" collection
      const participantSnapshot = await firestore
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

      // Create a new document in the "rewards" collection
      const rewardDoc = firestore.collection('rewards').doc();
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
        transactionHash: null,
        amountIncUSD: null,
      });

      console.log('Reward document created:', rewardDoc.id);
      response.status(200).send('Reward document created successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Internal server error');
    }
  });
