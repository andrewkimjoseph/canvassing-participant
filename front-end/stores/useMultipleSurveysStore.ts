import { create } from "zustand";
import { persist } from "zustand/middleware";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { Survey } from "@/entities/survey";
import { db } from "@/firebase";
import { Reward } from "@/entities/reward";
import { Address } from "viem";
import useParticipantStore from "./useParticipantStore";
import { checkIfSurveyIsFullyBooked } from "@/services/web3/checkIfSurveyIsAtMaxParticipants";
import { checkIfParticipantIsScreenedForSurvey } from "@/services/checkIfParticipantHasBeenBookedForSurvey";
import { checkIfParticipantHasCompletedSurvey } from "@/services/db/checkIfParticipantHasCompletedSurvey";
import { checkIfSurveyIsForTestnet } from "@/services/web3/checkIfSurveyIsForTestnet";
import { getRewardTokenForSurvey } from "@/services/web3/getRewardTokenContractAddress";
import { RewardToken } from "@/types/rewardToken";

// Helper function to determine if a chainId is for testnet
const isTestnetChainId = (chainId: number): boolean => {
  // Only Celo Alfajores testnet is considered a testnet
  return chainId === 44787;
};

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (
    chainId: number,
    rewards: Reward[],
    currentToken: RewardToken
  ) => Promise<void>;
}

const useMultipleSurveysStore = create<SurveyStoreState>()(
  persist(
    (set) => ({
      surveys: [],
      loading: false,

      fetchSurveys: async (chainId, rewards, currentToken) => {
        set({ loading: true });

        const { participant } = useParticipantStore.getState();
        const isOnTestnet = isTestnetChainId(chainId);

        try {
          const participatedSurveyIds = rewards.map(
            (reward) => reward.surveyId
          );

          // Simple query to get available surveys
          const surveyQuery = query(
            collection(db, "surveys"),
            where("isAvailable", "==", true),
            limit(5)
          );

          // Get available surveys
          const surveySnapshot = await getDocs(surveyQuery);

          // Filter out surveys the participant has already completed
          let allSurveys = surveySnapshot.docs
            .filter((doc) => !participatedSurveyIds.includes(doc.id))
            .map((doc) => ({
              ...(doc.data() as Survey),
              id: doc.id,
            }));

          const surveyPromises = allSurveys.map(async (survey) => {
            if (!survey.isAvailable) return null;

            const countryIsValid =
              survey.targetCountry === "ALL" ||
              survey.targetCountry
                ?.split(", ")
                .includes(participant?.country || "");

            const genderIsValid =
              survey.targetGender === "ALL" ||
              survey.targetGender === participant?.gender;

            if (!survey.contractAddress) return null;
            if (!countryIsValid) return null;
            if (!genderIsValid) return null;
            if (survey.isTest && !participant?.isAdmin) return null;

            // Check if survey is for testnet
            const isForTestnet = await checkIfSurveyIsForTestnet({
              _contractAddress: survey.contractAddress,
            });

            // Set the isForTestnet property on the survey
            survey.isForTestnet = isForTestnet;

            // Skip survey if network type doesn't match
            // If we're on a testnet but survey is not for testnet, skip it
            // If we're on mainnet but survey is for testnet, skip it
            if (isOnTestnet !== isForTestnet) return null;

            // Get the reward token address
            const rewardToken = await getRewardTokenForSurvey({
              _surveyContractAddress: survey.contractAddress,
              _chainId: chainId,
            });
            survey.rewardToken = rewardToken;

            if (survey.rewardToken !== currentToken) return null;

            const [
              surveyIsFullyBooked,
              surveyIsAlreadyBookedByUser,
              participantHasCompletedSurvey,
            ] = await Promise.all([
              checkIfSurveyIsFullyBooked({
                _surveyContractAddress: survey.contractAddress as Address,
                _chainId: chainId,
              }),
              checkIfParticipantIsScreenedForSurvey({
                _participantId: participant?.id as string,
                _participantWalletAddress: participant?.walletAddress as string,
                _surveyContractAddress: survey.contractAddress as string,
                _surveyId: survey.id,
                _chainId: chainId,
              }),
              checkIfParticipantHasCompletedSurvey({
                _participantWalletAddress: participant?.walletAddress as string,
                _surveyId: survey.id,
              }),
            ]);

            if (surveyIsFullyBooked) return null;

            if (
              survey.isTest &&
              participant?.isAdmin &&
              participantHasCompletedSurvey
            )
              return null;

            if (!survey.isTest && !participant?.isAdmin)
              return null;

            if (surveyIsAlreadyBookedByUser) {
              survey.isAlreadyBookedByUser = true;
            }

            if (survey.isAlreadyBookedByUser && participantHasCompletedSurvey) {
              return null;
            }

            if (participantHasCompletedSurvey) {
              return null;
            }

            return survey;
          });

          const surveyResults = await Promise.all(surveyPromises);
          const validSurveys = surveyResults.filter(
            (survey) => survey !== null
          ) as Survey[];

          validSurveys.sort(
            (a, b) =>
              (b.timeCreated?.seconds ?? 0) - (a.timeCreated?.seconds ?? 0)
          );

          set({ surveys: validSurveys, loading: false });
        } catch (error) {
          console.error("Error fetching surveys:", error);
          set({ loading: false });
        }
      },
    }),
    {
      name: "surveys-storage",
      partialize: (state) => ({ surveys: state.surveys }), // Only persist surveys array
    }
  )
);

export default useMultipleSurveysStore;
