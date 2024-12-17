import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';
import { Address } from 'viem';
import { checkIfUserAddressIsWhitelisted } from '@/services/web3/checkIfUserAddressIsWhitelisted';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (walletAddress: Address) => Promise<void>;
}

const useMultipleSurveysStore = create<SurveyStoreState>((set) => ({
  surveys: [],
  loading: false,

  fetchSurveys: async (walletAddress) => {
    set({ loading: true });
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

      // Query surveys excluding the ones already participated in
      let surveyQuery;
      if (participatedSurveyIds.length > 0) {
        surveyQuery = query(
          collection(db, 'surveys'),
          where('id', 'not-in', participatedSurveyIds)
        );
      } else {
        surveyQuery = query(collection(db, 'surveys'));
      }
      const surveySnapshot = await getDocs(surveyQuery);
      const surveys = surveySnapshot.docs.map((doc) => ({
        ...(doc.data() as Survey),
      }));

      // Filter surveys to check whitelist status using their contractAddress
      const filteredSurveys = [];
      for (const survey of surveys) {
        // if (!survey.isAvailable) continue; // Skip if the survey is marked as unavailable
        if (!survey.contractAddress) continue; // Skip if no contract address in survey
        const userIsWhitelisted = await checkIfUserAddressIsWhitelisted(
          walletAddress,
          {
            _walletAddress: walletAddress,
            _contractAddress: survey.contractAddress as Address,
          }
        );
        if (userIsWhitelisted) {
          filteredSurveys.push(survey);
        }
      }

      set({ surveys: filteredSurveys, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;
