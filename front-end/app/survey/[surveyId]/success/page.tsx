'use client';

import { useEffect, useState } from 'react';

import { useAccount, useChainId } from 'wagmi';

import { Box, Image, Text, Flex, Spinner } from '@chakra-ui/react';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { processRewardClaimByParticipant } from '@/services/web3/processRewardClaimByParticipant';
import { Address } from 'viem';
import { Toaster, toaster } from '@/components/ui/toaster';
import useSingleSurveyStore from '@/stores/useSingleSurveyStore';
import { Button } from '@/components/ui/button';
import { getContractBalance } from '@/services/web3/checkContractBalance';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase';
import useParticipantStore from '@/stores/useParticipantStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Reward } from '@/entities/reward';

export default function SuccessPage() {
  const [userAddress, setUserAddress] = useState('');
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { survey, fetchSurvey } = useSingleSurveyStore();
  const [isProcessingRewardClaim, setIsProcessingRewardClaim] = useState(false);

  const [isAbleToClaim, setIsAbleToClaim] = useState(false);

  const { participant } = useParticipantStore.getState();
  const params = useParams();
  const searchParams = useSearchParams();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  const surveyId = params.surveyId;
  const submissionId = searchParams.get('submissionId');
  const respondentId = searchParams.get('respondentId');

  useEffect(() => {
    if (!surveyId || !participant?.id) return;

    const rewardsCollection = collection(db, 'rewards');
    const rewardsQuery = query(
      rewardsCollection,
      where('participantId', '==', participant.id),
      where('surveyId', '==', surveyId)
    );

    const unsubscribe = onSnapshot(rewardsQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const rewardDoc = querySnapshot.docs[0];
        const reward = rewardDoc.data() as Reward;
        if (reward.whitelistingTransactionHash) {
          setIsAbleToClaim(false);
        }
      }
    });

    return () => unsubscribe();
  }, [surveyId, participant?.id]);

  const processRewardClaimByParticipantFn = async () => {
    setIsProcessingRewardClaim(true);

    if (!survey?.contractAddress || !survey?.rewardAmountIncUSD) {
      toaster.create({
        description:
          'Invalid survey claim request. Kindly reach out to support via the "More" tab.',
        duration: 3000,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    if (!submissionId || !respondentId || !address || !participant?.id) {
      toaster.create({
        description:
          'Invalid form submission/participant. Kindly reach out to support via the "More" tab.',
        duration: 3000,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const contractBalance = await getContractBalance(address, {
      _contractAddress: survey.contractAddress as Address,
      _chainId: chainId,
    });

    if (contractBalance < survey.rewardAmountIncUSD) {
      toaster.create({
        description:
          'Not enough balance to pay you out. Kindly reach out to support via the "More" tab.',
        duration: 3000,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    try {
      const claimIsProcessed = await processRewardClaimByParticipant(address, {
        _participantWalletAddress: address as Address,
        _smartContractAddress: survey.contractAddress as Address,
        _chainId: chainId,
      });

      if (claimIsProcessed.success) {
        toaster.create({
          description: 'Waiting for your reward record to be updated ...',
          duration: 3000,
          type: 'info',
        });

        const rewardsCollection = collection(db, 'rewards');
        const rewardsQuery = query(
          rewardsCollection,
          where('participantId', '==', participant.id),
          where('surveyId', '==', surveyId)
        );

        const querySnapshot = await getDocs(rewardsQuery);

        if (!querySnapshot.empty) {
          const rewardDoc = querySnapshot.docs[0]; // Assuming there's only one matching document
          await updateDoc(rewardDoc.ref, {
            isClaimed: true,
            transactionHash: claimIsProcessed.transactionHash,
            amountIncUSD: survey.rewardAmountIncUSD,
            timeUpdated: Timestamp.now(),
          });

          toaster.create({
            description: 'Reward claimed successfully!',
            duration: 3000,
            type: 'success',
          });

          // Wait for user feedback before navigating
          await new Promise((resolve) => setTimeout(resolve, 1500));

          trackAmplitudeEvent('Reward claimed', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
            surveyId: survey?.id,
          });

          router.replace(`/survey/${surveyId}/transaction-successful`);
        } else {
          toaster.create({
            description:
              'Reward record not found. Kindly reach out to support via the "More" tab.',
            duration: 3000,
            type: 'error',
          });
        }
      } else {
        toaster.create({
          description:
            'Reward claim was unsuccessful. Kindly reach out to support via the "More" tab.',
          duration: 3000,
          type: 'error',
        });
      }
    } catch (error) {
      toaster.create({
        description:
          'An unexpected error occurred. Kindly reach out to support via the "More" tab.',
        duration: 3000,
        type: 'error',
      });
    }

    setIsProcessingRewardClaim(false);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey(surveyId as string);
    }
  }, [surveyId, fetchSurvey]);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
    }
  }, [address, isConnected]);

  if (!isMounted)
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="#363062" />
      </Flex>
    );

  return (
    <Flex flexDirection={'column'} w={'100%'} bgColor={'#ECECEC'} h={'100vh'}>
      <Toaster />

      <Box
        bgColor="white"
        h="25"
        borderRadius={10}
        flexDirection={'column'}
        pb={2}
        mb={4}
        alignSelf={'center'}
        w={'4/6'}
        mt={10}
        mx={2}
        justifyContent={'center'}
      >
        <Box bgColor="white" h="30" borderRadius={15}>
          <Flex flexDirection="column" alignItems="center">
            <Box
              width="100%"
              height={'35%'}
              bgColor={'#94B9FF'}
              overflow="hidden"
              borderRadius={10}
            >
              <Image
                src="/success.png" // Replace with your image URL
                alt="Background"
                width="100%"
                height="35vh"
                objectFit={'contain'}
                blur={'md'}
              />
            </Box>
            <Text
              fontSize={'lg'}
              mb={2}
              color="#363062"
              alignSelf={'center'}
              mt={4}
            >
              You earned {survey?.rewardAmountIncUSD} cUSD
            </Text>

            <Text fontSize={'sm'} mb={2} color="black" textAlign={'center'}>
              Once claimed, this amount will be transferred to your Minipay
              wallet.
            </Text>
          </Flex>
        </Box>
      </Box>
      <Button
        bgColor={'#363062'}
        borderRadius={15}
        px={6}
        w={'3/6'}
        mt={5}
        alignSelf={'center'}
        mb={16}
        onClick={() => {
          trackAmplitudeEvent('Claim clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
            surveyId: survey?.id,
          });
          processRewardClaimByParticipantFn();
        }}
        loading={isProcessingRewardClaim}
        disabled={!isAbleToClaim}
        loadingText={<SpinnerIconC />}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Claim
        </Text>
      </Button>
    </Flex>
  );
}
