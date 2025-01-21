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
  fetchSurveys: (walletAddress: Address, chainId: number) => Promise<void>;
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

  fetchSurveys: async (walletAddress, chainId) => {
    set({ loading: true });

    const { participant } = useParticipantStore.getState();

    try {
      // Fetch the rewards for the user's wallet
      const rewardQuery = query(
        collection(db, 'rewards'),
        where('participantWalletAddress', '==', walletAddress)
      );
      const rewardSnapshot = await getDocs(rewardQuery);
      const participatedSurveyIds = rewardSnapshot.docs.map(
        (doc) => (doc.data() as Reward).surveyId
      );

      // Get all surveys with chunked queries if needed
      let allSurveys: Survey[] = [];
      
      if (participatedSurveyIds.length > 0) {
        // Split participated IDs into chunks of 10 (Firestore limit)
        const chunks = chunkArray(participatedSurveyIds, 10);
        
        // Query for each chunk and combine results
        for (let chunk of chunks) {
          const chunkQuery = query(
        collection(db, 'surveys'),
        where('id', 'not-in', chunk),
        where('isAvailable', '==', true)
          );
          const chunkSnapshot = await getDocs(chunkQuery);
          const chunkSurveys = chunkSnapshot.docs.map(doc => ({
        ...(doc.data() as Survey)
          }));
          allSurveys.push(...chunkSurveys);
        }
        
        // Remove duplicates that might occur from chunked queries
        allSurveys = Array.from(new Set(allSurveys.map(survey => survey.id)))
          .map(id => allSurveys.find(survey => survey.id === id)!);
      } else {
        // If no participated surveys, get all surveys
        const surveyQuery = query(
          collection(db, 'surveys'),
          where('isAvailable', '==', true)
        );
        const surveySnapshot = await getDocs(surveyQuery);
        allSurveys = surveySnapshot.docs.map(doc => ({
          ...(doc.data() as Survey)
        }));
      }

      const filteredSurveys: Survey[] = [];
      for (let survey of allSurveys) {

        const countryIsValid =
          survey.targetCountry === 'A' ||
          survey.targetCountry === participant?.country;

        const genderIsValid =
          survey.targetGender === 'A' ||
          survey.targetGender === participant?.gender;

        if (!survey.contractAddress) continue;
        if (!countryIsValid) continue;
        if (!genderIsValid) continue;
        if (survey.isTest && !participant?.isAdmin) continue;

        const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
          _surveyContractAddress: survey.contractAddress as Address,
          _chainId: chainId,
        });

        if (survey.isTest && participant?.isAdmin && surveyIsFullyBooked) continue;

        if (!survey.isTest && !participant?.isAdmin && surveyIsFullyBooked) continue;

        const surveyIsAlreadyBookedByUser =
          await checkIfParticipantIsScreenedForSurvey({
            _participantId: participant?.id as string,
            _participantWalletAddress: participant?.walletAddress as string,
            _surveyContractAddress: survey.contractAddress as string,
            _surveyId: survey.id,
            _chainId: chainId,
          });

        const participantHasCompletedSurvey =
          await checkIfParticipantHasCompletedSurvey({
            _participantId: participant?.id as string,
            _participantWalletAddress: participant?.walletAddress as string,
            _surveyId: survey.id,
          });

        if (surveyIsAlreadyBookedByUser) {
          survey.isAlreadyBookedByUser = true;
        }
        if (survey.isAlreadyBookedByUser && participantHasCompletedSurvey) {
          continue;
        }


        if (surveyIsFullyBooked && participantHasCompletedSurvey) {
          continue;
        }

        filteredSurveys.push(survey);
      }

      set({ surveys: filteredSurveys, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;