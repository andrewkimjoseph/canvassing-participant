import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Survey } from '@/entities/survey';
import { db } from '@/firebase';
import { Reward } from '@/entities/reward';
import { Address } from 'viem';
import useParticipantStore from './useParticipantStore';
import { checkIfSurveyIsFullyBooked } from '@/services/web3/checkIfSurveyIsFullyBooked';
import { checkIfParticipantIsScreenedForSurvey } from '@/services/checkIfParticipantHasBeenBookedForSurvey';

interface SurveyStoreState {
  surveys: Survey[];
  loading: boolean;
  fetchSurveys: (walletAddress: Address, chainId: number) => Promise<void>;
}

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

      // Query surveys excluding the ones already participated in
      let surveyQuery;
      if (participatedSurveyIds.length > 0) {
        surveyQuery = query(
          collection(db, 'surveys'),
          where('id', 'not-in', participatedSurveyIds)
        );
      } else {
        surveyQuery = query(collection(db, 'surveys'));
      }
      const surveySnapshot = await getDocs(surveyQuery);
      const surveys = surveySnapshot.docs.map((doc) => ({
        ...(doc.data() as Survey),
      }));

      const filteredSurveys: Survey[] = [];
      for (let survey of surveys) {
        // Check if the survey is fully booked
        const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
          _surveyContractAddress: survey.contractAddress as Address,
          _chainId: chainId
        });



        // Check if the participant's country matches the survey's target country
        const countryIsValid =
          survey.targetCountry === 'A' ||
          survey.targetCountry === participant?.country;

        // Check if the participant's gender matches the survey's target gender
        const genderIsValid =
          survey.targetGender === 'A' ||
          survey.targetGender === participant?.gender;


        

        // Apply all filters
        if (!survey.isAvailable) continue;
        if (!survey.contractAddress) continue;
        if (!countryIsValid) continue;
        if (!genderIsValid) continue;
        if (survey.isTest && !participant?.isAdmin) continue;

        const surveyIsAlreadyBookedByUser = await checkIfParticipantIsScreenedForSurvey({
          _participantId: participant?.id as string,
          _participantWalletAddress: participant?.walletAddress as string,
          _surveyContractAddress: survey.contractAddress as string,
          _surveyId: survey.id,
          _chainId: chainId
        });

        if (surveyIsAlreadyBookedByUser) {
          survey.isAlreadyBookedByUser = true;
        }

        if (surveyIsFullyBooked && !survey.isAlreadyBookedByUser) continue;
 
        filteredSurveys.push(survey);
      }

      set({ surveys: filteredSurveys, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
}));

export default useMultipleSurveysStore;
