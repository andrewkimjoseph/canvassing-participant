import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Reward } from '@/entities/reward';
import { db } from '@/firebase';
import { checkIfRewardIsForTestnet } from '@/services/web3/checkIfRewardIsForTestnet';

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
          const fetchedRewards = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Reward[];

          const improvedRewards: Reward[] = [];

          for (let reward of fetchedRewards) {
            const rewardIsForTestnet = await checkIfRewardIsForTestnet({
              _transactionHash: reward.transactionHash as string,
            });

            if (rewardIsForTestnet) {
              reward.isForTestnet = true;
            } else {
              reward.isForTestnet = false;
            }

            improvedRewards.push(reward);
          }

          improvedRewards.sort(
            (a, b) =>
              (b.timeCreated?.seconds ?? 0) - (a.timeCreated?.seconds ?? 0)
          ); // Sort rewards from latest to earliest
          set({ rewards: improvedRewards, loading: false });
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
