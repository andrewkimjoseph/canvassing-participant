import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Researcher } from '@/entities/researcher';

interface SingleResearcherStoreState {
  researcher: Researcher | null;
  loading: boolean;
  fetchResearcher: (researcherId: string) => Promise<void>;
  clearResearcher: () => void;
}

const useSingleResearcherStore = create<SingleResearcherStoreState>((set) => ({
  researcher: null,
  loading: false,
  
  fetchResearcher: async (researcherId: string) => {
    set({ loading: true });
    try {
      const researcherDoc = await getDoc(doc(db, 'researchers', researcherId));
      
      if (researcherDoc.exists()) {
        const researcherData = {
          id: researcherDoc.id,
          ...researcherDoc.data(),
        } as Researcher;
        
        set({ researcher: researcherData, loading: false });
      } else {
        console.error('Researcher not found');
        set({ researcher: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching researcher:', error);
      set({ researcher: null, loading: false });
    }
  },

  clearResearcher: () => {
    set({ researcher: null });
  },
}));

export default useSingleResearcherStore;