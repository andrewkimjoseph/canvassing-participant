import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Reward } from '@/entities/reward';
import { db } from '@/firebase';

interface RewardStoreState {
  rewards: Reward[];
  loading: boolean;
  fetchRewards: (walletAddress: string) => Promise<void>;
}

const useRewardStore = create<RewardStoreState>()(
  persist(
    (set) => ({
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
          set({ loading: false });
        }
      },
    }),
    {
      name: 'reward-storage', // Unique name for localStorage
      partialize: (state) => ({ rewards: state.rewards }), // Persist only rewards
    }
  )
);

export default useRewardStore;
