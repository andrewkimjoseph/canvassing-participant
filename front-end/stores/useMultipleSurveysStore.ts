import { create } from 'zustand';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';
import { Address } from 'viem';
import useParticipantStore from './useParticipantStore';
import { checkIfSurveyIsFullyBooked } from '@/services/web3/checkIfSurveyIsFullyBooked';
import { checkIfParticipantIsScreenedForSurvey } from '@/services/checkIfParticipantHasBeenBookedForSurvey';
import { checkIfParticipantHasCompletedSurvey } from '@/services/db/checkIfParticipantHasCompletedSurvey';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (chainId: number, rewards: Reward[]) => Promise<void>;
}

// Helper function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const useMultipleSurveysStore = create<SurveyStoreState>((set) => ({
  surveys: [],
  loading: false,

  fetchSurveys: async (chainId, rewards) => {
    set({ loading: true });

    const { participant } = useParticipantStore.getState();

    try {
      const participatedSurveyIds = rewards.map(
        (reward) => reward.surveyId
      );

      // Get all surveys with chunked queries if needed
      let allSurveys: Survey[] = [];

      if (participatedSurveyIds.length > 0) {
        // Split participated IDs into chunks of 10 (Firestore limit)
        const chunks = chunkArray(participatedSurveyIds, 10);

        // Query for each chunk and combine results
        const chunkPromises = chunks.map(async (chunk) => {
          const chunkQuery = query(
            collection(db, 'surveys'),
            where('id', 'not-in', chunk),
            where('isAvailable', '==', true)
          );
          const chunkSnapshot = await getDocs(chunkQuery);
          return chunkSnapshot.docs.map((doc) => ({
            ...(doc.data() as Survey),
          }));
        });

        const chunkResults = await Promise.all(chunkPromises);
        allSurveys = chunkResults.flat();

        // Remove duplicates that might occur from chunked queries
        allSurveys = Array.from(
          new Set(allSurveys.map((survey) => survey.id))
        ).map((id) => allSurveys.find((survey) => survey.id === id)!);
      } else {
        // If no participated surveys, get all surveys
        const surveyQuery = query(collection(db, 'surveys'));
        const surveySnapshot = await getDocs(surveyQuery);
        allSurveys = surveySnapshot.docs.map((doc) => ({
          ...(doc.data() as Survey),
        }));
      }

      const filteredSurveys: Survey[] = [];
      const surveyPromises = allSurveys.map(async (survey) => {
        if (!survey.isAvailable) return null;

        const countryIsValid =
          survey.targetCountry === 'ALL' ||
          survey.targetCountry
            ?.split(', ')
            .includes(participant?.country || '');

        const genderIsValid =
          survey.targetGender === 'ALL' ||
          survey.targetGender === participant?.gender;

        if (!survey.contractAddress) return null;
        if (!countryIsValid) return null;
        if (!genderIsValid) return null;
        if (survey.isTest && !participant?.isAdmin) return null;

        const [
          surveyIsFullyBooked,
          surveyIsAlreadyBookedByUser,
          participantHasCompletedSurvey,
        ] = await Promise.all([
          checkIfSurveyIsFullyBooked({
            _surveyContractAddress: survey.contractAddress as Address,
            _chainId: chainId,
          }),
          checkIfParticipantIsScreenedForSurvey({
            _participantId: participant?.id as string,
            _participantWalletAddress: participant?.walletAddress as string,
            _surveyContractAddress: survey.contractAddress as string,
            _surveyId: survey.id,
            _chainId: chainId,
          }),
          checkIfParticipantHasCompletedSurvey({
            _participantId: participant?.id as string,
            _participantWalletAddress: participant?.walletAddress as string,
            _surveyId: survey.id,
          }),
        ]);

        if (survey.isTest && participant?.isAdmin && surveyIsFullyBooked)
          return null;

        if (!survey.isTest && !participant?.isAdmin && surveyIsFullyBooked)
          return null;

        if (surveyIsAlreadyBookedByUser) {
          survey.isAlreadyBookedByUser = true;
        }
        if (survey.isAlreadyBookedByUser && participantHasCompletedSurvey) {
          return null;
        }

        if (surveyIsFullyBooked && participantHasCompletedSurvey) {
          return null;
        }

        return survey;
      });

      const surveyResults = await Promise.all(surveyPromises);
      const validSurveys = surveyResults.filter(
        (survey) => survey !== null
      ) as Survey[];

      set({ surveys: validSurveys, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;
