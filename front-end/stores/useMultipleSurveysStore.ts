import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  collection,
  getDocs,
  query,
  where,
  or,
  limit,
} from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';
import { Address } from 'viem';
import useParticipantStore from './useParticipantStore';
import { checkIfSurveyIsFullyBooked } from '@/services/web3/checkIfSurveyIsAtMaxParticipants';
import { checkIfParticipantIsScreenedForSurvey } from '@/services/checkIfParticipantHasBeenBookedForSurvey';
import { checkIfParticipantHasCompletedSurvey } from '@/services/db/checkIfParticipantHasCompletedSurvey';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (chainId: number, rewards: Reward[]) => Promise<void>;
}

// Helper function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
};

const useMultipleSurveysStore = create<SurveyStoreState>()(
  persist(
    (set) => ({
      surveys: [],
      loading: false,

      fetchSurveys: async (chainId, rewards) => {
        set({ loading: true });

        const { participant } = useParticipantStore.getState();

        try {
          const participatedSurveyIds = rewards.map(
            (reward) => reward.surveyId
          );
          let allSurveys: Survey[] = [];

          const surveyQuery = query(
            collection(db, 'surveys'),
            where('isAvailable', '==', true),
            limit(5)
          );

          if (participatedSurveyIds.length > 0) {
            const chunks = chunkArray(participatedSurveyIds, 10);

            const chunkPromises = chunks.map(async (chunk) => {
              const availableSurveys = await getDocs(surveyQuery);
              const availableSurveysNotDoneByParticipant =
                availableSurveys.docs.filter((doc) => !chunk.includes(doc.id));
              return availableSurveysNotDoneByParticipant.map(
                (surveySnapshot) => ({
                  ...(surveySnapshot.data() as Survey),
                })
              );
            });

            const chunkResults = await Promise.all(chunkPromises);
            allSurveys = chunkResults.flat();

            const surveyMap = new Map<string, Survey>();
            allSurveys.forEach((survey) => surveyMap.set(survey.id, survey));
            allSurveys = Array.from(surveyMap.values());
          } else {
            const surveySnapshot = await getDocs(surveyQuery);
            allSurveys = surveySnapshot.docs.map((doc) => ({
              ...(doc.data() as Survey),
            }));
          }

          const surveyPromises = allSurveys.map(async (survey) => {
            if (!survey.isAvailable) return null;

            const countryIsValid =
              survey.targetCountry === 'ALL' ||
              survey.targetCountry
                ?.split(', ')
                .includes(participant?.country || '');

            const genderIsValid =
              survey.targetGender === 'ALL' ||
              survey.targetGender === participant?.gender;

            if (!survey.contractAddress) return null;
            if (!countryIsValid) return null;
            if (!genderIsValid) return null;
            if (survey.isTest && !participant?.isAdmin) return null;

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
                _participantId: participant?.id as string,
                _participantWalletAddress: participant?.walletAddress as string,
                _surveyId: survey.id,
              }),
            ]);

            if (survey.isTest && participant?.isAdmin && surveyIsFullyBooked)
              return null;

            if (!survey.isTest && !participant?.isAdmin && surveyIsFullyBooked)
              return null;

            if (surveyIsAlreadyBookedByUser) {
              survey.isAlreadyBookedByUser = true;
            }
            if (survey.isAlreadyBookedByUser && participantHasCompletedSurvey) {
              return null;
            }

            if (surveyIsFullyBooked && participantHasCompletedSurvey) {
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
          console.error('Error fetching surveys:', error);
          set({ loading: false });
        }
      },
    }),
    {
      name: 'surveys-storage',
      partialize: (state) => ({ surveys: state.surveys }), // Only persist surveys array
    }
  )
);

export default useMultipleSurveysStore;
