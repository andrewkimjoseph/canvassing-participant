// /stores/useSurveyStore.ts
import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/app/firebase';


interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: () => Promise<void>;
}

const useSurveyStore = create<SurveyStoreState>((set) => ({
  surveys: [],
  loading: false,
  
  fetchSurveys: async () => {
    set({ loading: true });
    try {
      const snapshot = await getDocs(collection(db, 'surveys'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Survey[];
      set({ surveys: data, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useSurveyStore;
