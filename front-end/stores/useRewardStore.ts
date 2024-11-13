// /stores/useRewardStore.ts
import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Reward } from '@/entities/reward';
import { db } from '@/firebase';

interface RewardStoreState {
  rewards: Reward[];
  loading: boolean;
  fetchRewards: (walletAddress: string) => Promise<void>;
}

const useRewardStore = create<RewardStoreState>((set) => ({
  rewards: [],
  loading: false,
  
  fetchRewards: async (walletAddress) => {
    set({ loading: true });
    try {
      const q = query(
        collection(db, 'rewards'),
        where('participantWalletAddress', '==', walletAddress)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reward[];
      set({ rewards: data, loading: false });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      set({ loading: false });
    }
  },
}));

export default useRewardStore;
