import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { Survey } from "@/entities/survey";
import { db } from "@/firebase";
import { getRewardTokenForSurvey } from "@/services/web3/getRewardTokenContractAddress";
import { RewardToken } from "@/types/rewardToken";
import { Address } from "viem";

interface SingleSurveyStoreState {
  survey: Survey | null;
  loading: boolean;
  fetchSurvey: (surveyId: string, chainId: number) => Promise<void>;
  clearSurvey: () => void;
}

const useSingleSurveyStore = create<SingleSurveyStoreState>((set) => ({
  survey: null,
  loading: false,

  fetchSurvey: async (surveyId: string, chainId: number) => {
    set({ loading: true });
    try {
      const surveyDoc = await getDoc(doc(db, "surveys", surveyId));

      if (surveyDoc.exists()) {
        const surveyData = {
          id: surveyDoc.id,
          ...surveyDoc.data(),
        } as Survey;

        // Always fetch the reward token (survey always has a contract address)
        try {
          const rewardToken = await getRewardTokenForSurvey({
            _surveyContractAddress: surveyData.contractAddress as Address,
            _chainId: chainId,
          });

          surveyData.rewardToken = rewardToken as RewardToken;
        } catch (tokenError) {
          surveyData.rewardToken = RewardToken.celoDollar;
        }

        set({ survey: surveyData, loading: false });
      } else {
        set({ survey: null, loading: false });
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      set({ survey: null, loading: false });
    }
  },

  clearSurvey: () => {
    set({ survey: null });
  },
}));

export default useSingleSurveyStore;
