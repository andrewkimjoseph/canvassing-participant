import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (walletAddress: string) => Promise<void>;
}

const useMultipleSurveysStore = create<SurveyStoreState>((set) => ({
  surveys: [],
  loading: false,

  fetchSurveys: async (walletAddress: string) => {
    set({ loading: true });
    try {
      const rewardQuery = query(
        collection(db, 'rewards'),
        where('participantWalletAddress', '==', walletAddress)
      );
      const rewardSnapshot = await getDocs(rewardQuery);
      const participatedSurveyIds = rewardSnapshot.docs.map(
        (doc) => (doc.data() as Reward).surveyId
      );

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
      const data = surveySnapshot.docs.map((doc) => ({
        ...(doc.data() as Survey), // Assert type here
      }));

      set({ surveys: data, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;
