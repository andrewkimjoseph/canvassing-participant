import { create } from 'zustand';
import { collection, getDocs, query, where, or, and } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';
import { Address } from 'viem';
import useParticipantStore from './useParticipantStore';
import { checkIfSurveyIsFullyBooked } from '@/services/web3/checkIfSurveyIsFullyBooked';
import { checkIfParticipantIsScreenedForSurvey } from '@/services/checkIfParticipantHasBeenBookedForSurvey';
import { checkIfParticipantHasCompletedSurvey } from '@/services/db/checkIfParticipantHasCompletedSurvey';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (walletAddress: Address, chainId: number) => Promise<void>;
}

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const useMultipleSurveysStore = create<SurveyStoreState>((set) => ({
  surveys: [],
  loading: false,

  fetchSurveys: async (walletAddress, chainId) => {
    set({ loading: true });

    const { participant } = useParticipantStore.getState();

    try {
      // Fetch the rewards for the user's wallet
      const rewardQuery = query(
        collection(db, 'rewards'),
        where('participantWalletAddress', '==', walletAddress)
      );
      const rewardSnapshot = await getDocs(rewardQuery);
      const participatedSurveyIds = rewardSnapshot.docs.map(
        (doc) => (doc.data() as Reward).surveyId
      );

      let allSurveys: Survey[] = [];
      
      if (participatedSurveyIds.length > 0) {
        const chunks = chunkArray(participatedSurveyIds, 10);
        
        for (let chunk of chunks) {
          const chunkQuery = query(
            collection(db, 'surveys'),
            and(
              where('id', 'not-in', chunk),
              where('isAvailable', '==', true),
              where('contractAddress', '!=', null),
              or(
                where('targetCountry', '==', 'A'),
                where('targetCountry', '==', participant?.country)
              ),
              or(
                where('targetGender', '==', 'A'),
                where('targetGender', '==', participant?.gender)
              ),
              participant?.isAdmin 
                ? where('isTest', 'in', [true, false])
                : where('isTest', '==', false)
            )
          );
          const chunkSnapshot = await getDocs(chunkQuery);
          const chunkSurveys = chunkSnapshot.docs.map(doc => ({
            ...(doc.data() as Survey)
          }));
          allSurveys.push(...chunkSurveys);
        }
        
        allSurveys = Array.from(new Set(allSurveys.map(survey => survey.id)))
          .map(id => allSurveys.find(survey => survey.id === id)!);
      } else {
        const surveyQuery = query(
          collection(db, 'surveys'),
          and(
            where('isAvailable', '==', true),
            where('contractAddress', '!=', null),
            or(
              where('targetCountry', '==', 'A'),
              where('targetCountry', '==', participant?.country)
            ),
            or(
              where('targetGender', '==', 'A'),
              where('targetGender', '==', participant?.gender)
            ),
            participant?.isAdmin 
              ? where('isTest', 'in', [true, false])
              : where('isTest', '==', false)
          )
        );
        const surveySnapshot = await getDocs(surveyQuery);
        allSurveys = surveySnapshot.docs.map(doc => ({
          ...(doc.data() as Survey)
        }));
      }

      const filteredSurveys: Survey[] = [];
      for (let survey of allSurveys) {
        const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
          _surveyContractAddress: survey.contractAddress as Address,
          _chainId: chainId,
        });

        if (survey.isTest && participant?.isAdmin && surveyIsFullyBooked) continue;
        if (!survey.isTest && !participant?.isAdmin && surveyIsFullyBooked) continue;

        const surveyIsAlreadyBookedByUser = await checkIfParticipantIsScreenedForSurvey({
          _participantId: participant?.id as string,
          _participantWalletAddress: participant?.walletAddress as string,
          _surveyContractAddress: survey.contractAddress as string,
          _surveyId: survey.id,
          _chainId: chainId,
        });

        const participantHasCompletedSurvey = await checkIfParticipantHasCompletedSurvey({
          _participantId: participant?.id as string,
          _participantWalletAddress: participant?.walletAddress as string,
          _surveyId: survey.id,
        });

        if (surveyIsAlreadyBookedByUser) {
          survey.isAlreadyBookedByUser = true;
        }
        if (survey.isAlreadyBookedByUser && participantHasCompletedSurvey) continue;
        if (surveyIsFullyBooked && participantHasCompletedSurvey) continue;

        filteredSurveys.push(survey);
      }

      set({ surveys: filteredSurveys, loading: false });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;