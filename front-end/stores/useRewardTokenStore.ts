import { RewardToken } from "@/types/rewardToken";
import { create } from "zustand";
import { persist } from "zustand/middleware";



interface RewardTokenStoreState {
  currentToken: RewardToken;
  setCurrentToken: (token: RewardToken) => void;
}

const useRewardTokenStore = create<RewardTokenStoreState>()(
  persist(
    (set) => ({
      currentToken: RewardToken.goodDollar, // Default value
      setCurrentToken: (token: RewardToken) => set({ currentToken: token }),
    }),
    {
      name: "reward-token-storage",
    }
  )
);

export default useRewardTokenStore;