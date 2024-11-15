import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';

interface SingleSurveyStoreState {
  survey: Survey | null;
  loading: boolean;
  fetchSurvey: (surveyId: string) => Promise<void>;
  clearSurvey: () => void;
}

const useSingleSurveyStore = create<SingleSurveyStoreState>((set) => ({
  survey: null,
  loading: false,
  
  fetchSurvey: async (surveyId: string) => {
    set({ loading: true });
    try {
      const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
      
      if (surveyDoc.exists()) {
        const surveyData = {
          id: surveyDoc.id,
          ...surveyDoc.data(),
        } as Survey;
        
        set({ survey: surveyData, loading: false });
      } else {
        console.error('Survey not found');
        set({ survey: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      set({ survey: null, loading: false });
    }
  },

  clearSurvey: () => {
    set({ survey: null });
  },
}));

export default useSingleSurveyStore;