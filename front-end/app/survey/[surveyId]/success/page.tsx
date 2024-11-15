'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import { Box, Image, Text, Flex, Spinner } from '@chakra-ui/react';

import { useRouter, useParams } from 'next/navigation';
import { processRewardClaimByParticipant } from '@/services/processRewardClaimByParticipant';
import { Address } from 'viem';
import { Toaster, toaster } from '@/components/ui/toaster';
import useSingleSurveyStore from '@/stores/useSingleSurveyStore';
import { StringDecoder } from 'string_decoder';
import { Button } from '@/components/ui/button';
import { getContractBalance } from '@/services/checkContractBalance';

export default function SuccessPage() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { survey, fetchSurvey } = useSingleSurveyStore();
  const [isProcessingRewardClaim, setIsProcessingRewardClaim] = useState(false);

  const params = useParams();
  const surveyId = params.surveyId;

  const processRewardClaimByParticipantFn = async () => {
    setIsProcessingRewardClaim(true);
    if (!survey?.contractAddress || !survey?.rewardAmountIncUSD) {
      toaster.create({
        description: 'CE1',
        duration: 3000,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const contractBalance = await getContractBalance(address, {
      _contractAddress: survey.contractAddress as Address,
    });

    if (contractBalance < survey.rewardAmountIncUSD) {
      toaster.create({
        description: 'CE2',
        duration: 3000,
        type: 'error',
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const claimIsProcessed = await processRewardClaimByParticipant(address, {
      _participantWalletAddress: address as Address,
      _smartContractAddress: survey.contractAddress as Address,
    });

    if (claimIsProcessed) {
      toaster.create({
        description: 'Reward claimed successfully!',
        duration: 3000,
        type: 'success',
      });

      // Wait for user feedback before navigating
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push(`/survey/${surveyId}/transaction-successful`);
    } else {
      toaster.create({
        description: 'Failed to claim reward. Please try again.',
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
        onClick={processRewardClaimByParticipantFn}
        loading={isProcessingRewardClaim}
        loadingText="Processing claim"
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Claim
        </Text>
      </Button>
    </Flex>
  );
}
