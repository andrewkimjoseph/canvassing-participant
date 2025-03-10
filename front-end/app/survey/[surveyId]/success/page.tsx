'use client';

import { useEffect, useState } from 'react';

import { useAccount, useChainId } from 'wagmi';

import { Box, Image, Text, Flex, Spinner } from '@chakra-ui/react';

import { useParams, useSearchParams } from 'next/navigation';
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
  getDocsFromServer,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import useParticipantStore from '@/stores/useParticipantStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Reward } from '@/entities/reward';
import { Survey } from '@/entities/survey';

export default function SuccessPage() {
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const { address, isConnected } = useAccount();
  const { survey, fetchSurvey } = useSingleSurveyStore();
  const [isProcessingRewardClaim, setIsProcessingRewardClaim] = useState(false);

  const { participant } = useParticipantStore.getState();
  const params = useParams();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  const surveyId = params.surveyId;

  const toasterIds = {
    invalidOrUndetectedSurveyId: '1',
    surveyDoesNotExist: '2',
    connectionLost: '3',
    rewardRecordNotFound: '4',
    notEnoughBalance: '5',
    claimProcessInitiated: '6',
    rewardRecordFound: '7',
    rewardClaimedSuccessfully: '8',
  };

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
    }
  }, [address, isConnected]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey(surveyId as string);
    }
  }, [surveyId, fetchSurvey]);

  /**
   * Processes the reward claim by a participant.
   * 
   * This function performs several checks and operations to ensure that the reward claim process is valid and successful.
   * It includes validation of the survey ID, connection status, survey existence, contract balance, and reward record.
   * If all checks pass, it initiates the reward claim process and updates the reward record in the database.
   * 
   * @async
   * @function processRewardClaimByParticipantFn
   * @returns {Promise<void>} A promise that resolves when the reward claim process is complete.
   * 
   * @throws Will display a toaster notification for various error conditions:
   * - Invalid or undetected survey ID
   * - Connection lost
   * - Survey does not exist
   * - Not enough balance to pay out
   * - Reward record not found
   * - Unexpected error during the reward claim process
   * 
   * @example
   * // Example usage:
   * await processRewardClaimByParticipantFn();
   */
  const processRewardClaimByParticipantFn = async (): Promise<void> => {
    setIsProcessingRewardClaim(true);

    if (!surveyId || typeof surveyId !== 'string') {
      toaster.create({
        id: toasterIds.invalidOrUndetectedSurveyId,
        description:
          'Survey id was not detected or is invalid. Contact support via "More".',
        duration: 4500,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    if (!isConnected) {
      toaster.create({
        id: toasterIds.connectionLost,
        description:
          'Connection lost. Refresh this page and try claiming again.',
        duration: 4500,
        type: 'warning',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const surveySnapshot = await getDoc(doc(db, 'surveys', surveyId));

    if (!surveySnapshot.exists()) {
      toaster.create({
        id: toasterIds.surveyDoesNotExist,
        description:
          'Survey does not exist. Contact support via "More".',
        duration: 4500,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const fetchedSurvey = surveySnapshot.data() as Survey;

    const contractBalance = await getContractBalance(address, {
      _contractAddress: fetchedSurvey.contractAddress as Address,
      _chainId: chainId,
    });

    if (contractBalance < (fetchedSurvey.rewardAmountIncUSD as number)) {
      toaster.dismiss();
      toaster.create({
        id: toasterIds.notEnoughBalance,
        description: 'Not enough balance to pay you out. Contact support via "More".',
        duration: 6000,
        type: 'warning',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    toaster.create({
      id: toasterIds.claimProcessInitiated,
      description: 'Claim process initiated. Please wait ...',
      duration: 15000,
      type: 'info',
    });

    await new Promise((resolve) => setTimeout(resolve, 5250));

    const rewardsQuery = query(
      collection(db, 'rewards'),
      where('surveyId', '==', surveyId),
      where('participantId', '==', participant?.id)
    );

    const rewardQueryDocs = await getDocs(rewardsQuery);

    if (rewardQueryDocs.empty) {
      toaster.dismiss(toasterIds.claimProcessInitiated);
      toaster.create({
        id: toasterIds.rewardRecordNotFound,
        description:
          'Reward record not found. Contact support via "More".',
        duration: 4500,
        type: 'warning',
      });
      setIsProcessingRewardClaim(false);
      return;
    } else {
      toaster.dismiss(toasterIds.claimProcessInitiated);
    }

    toaster.create({
      id: toasterIds.rewardRecordFound,
      description:
        'Reward record found. You will now be prompted to approve the claim request.',
      duration: 15000,
      type: 'success',
    });

    const rewardRef = rewardQueryDocs.docs[0].ref;

    try {
      const reward = (
        await getDocsFromServer(rewardsQuery)
      ).docs[0].data() as Reward;

      const claimIsProcessed = await processRewardClaimByParticipant(address, {
        _participantWalletAddress: address as Address,
        _smartContractAddress: fetchedSurvey.contractAddress as Address,
        _rewardId: reward.id,
        _nonce: BigInt(reward.nonce as string),
        _signature: reward.signature as string,
        _chainId: chainId,
      });

      if (claimIsProcessed.success) {

        toaster.dismiss(toasterIds.rewardRecordFound);

        await updateDoc(rewardRef, {
          isClaimed: true,
          transactionHash: claimIsProcessed.transactionHash,
          amountIncUSD: survey?.rewardAmountIncUSD,
          timeUpdated: Timestamp.now(),
        });

        toaster.create({
          id: toasterIds.rewardClaimedSuccessfully,
          description: 'Reward claimed successfully!',
          duration: 6000,
          type: 'success',
        });

        // Wait for user feedback before navigating
        await new Promise((resolve) => setTimeout(resolve, 1500));

        trackAmplitudeEvent('Reward claimed', {
          participantWalletAddress: participant?.walletAddress,
          participantId: participant?.id,
          surveyId: survey?.id,
        });

        window.location.replace(`/survey/${surveyId}/transaction-successful`);
      } else {
        toaster.dismiss(toasterIds.rewardRecordFound);
        toaster.create({
          description:
            'Reward claim was unsuccessful. Contact support via "More".',
          duration: 6000,
          type: 'error',
        });
        trackAmplitudeEvent('Reward claim failed', {
          participantWalletAddress: participant?.walletAddress,
          participantId: participant?.id,
          surveyId: survey?.id,
        });
      }
    } catch (error) {
      toaster.dismiss(toasterIds.rewardRecordFound);
      toaster.create({
        description:
          'An unexpected error occurred. Contact support via "More".',
        duration: 6000,
        type: 'error',
      });
    }

    setIsProcessingRewardClaim(false);
  };

  if (!isMounted)
    return (
      <Flex justify="center" align="center" minH="100%">
        <Spinner size="xl" color="#363062" />
      </Flex>
    );

  return (
    <Flex flexDirection={'column'} w={'100%'} bgColor={'#ECECEC'} h={'100%'}>
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
        loading={isProcessingRewardClaim || !survey}
        disabled={isProcessingRewardClaim || !survey}
        loadingText={<SpinnerIconC />}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Claim
        </Text>
      </Button>
    </Flex>
  );
}
