'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { Box, Button, Text, Flex } from '@chakra-ui/react';
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from '@/components/ui/accordion';
import useSingleSurveyStore from '@/stores/useSingleSurveyStore';
import { Toaster, toaster } from '@/components/ui/toaster';
import useParticipantStore from '@/stores/useParticipantStore';
import { useRouter } from 'next/navigation';
import useSingleResearcherStore from '@/stores/useResearcherStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { auth } from '@/firebase';

export default function SurveyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const { address, isConnected } = useAccount();
  const pathname = usePathname();
  const surveyId = pathname?.split('/').pop();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  const router = useRouter();

  const { survey, loading, fetchSurvey } = useSingleSurveyStore();
  const { researcher, fetchResearcher } = useSingleResearcherStore();
  const { participant, getParticipant } = useParticipantStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
      getParticipant(address);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (isMounted && surveyId) {
      fetchSurvey(surveyId);
    }
  }, [isMounted, surveyId, fetchSurvey]);

  useEffect(() => {
    if (survey?.researcherId) {
      fetchResearcher(survey.researcherId);
    }
  }, [survey?.researcherId, fetchResearcher]);

  if (!isMounted)
    return (
      <Flex justify="center" align="center" minH="100%">
        <SpinnerIconC />
      </Flex>
    );
  if (loading)
    return (
      <Flex justify="center" align="center" minH="100%">
        <SpinnerIconC />
      </Flex>
    );
  if (!survey)
    return (
      <Flex justify="center" align="center" minH="100%">
        <Text>Survey not found</Text>
      </Flex>
    );

  return (
    <Flex flexDirection="column" w="100%" h="100%" bgColor="#ECECEC">
      <Toaster />
      <Box bgColor="white" borderRadius={10} pb={2} mb={4} mt={2} pt={1} mx={2}>
        <Flex flexDirection="column" alignItems="top" pl={2} pt={2} mt={1}>
          <Text fontSize="lg" mb={2} color="#363062">
            {survey.topic}
          </Text>
          <Text fontSize="sm" mb={2} color="black">
            {survey.brief}
          </Text>
        </Flex>
        <Flex
          flexDirection="row"
          pl={2}
          pt={2}
          justifyContent="start"
          alignItems="center"
        >
          <Text fontSize="lg" color="green">
            ${survey.rewardAmountIncUSD}
          </Text>
          <Text fontSize={'lg'} color="grey" pl={1}>
            per survey
          </Text>
        </Flex>
      </Box>

      <Box
        bgColor="white"
        borderRadius={10}
        pb={2}
        mb={2}
        pt={1}
        mx={2}
        px={2}
        py={2}
      >
        <AccordionRoot
          // value={value}
          multiple
          onClick={() => {
            trackAmplitudeEvent('Survey instructions clicked', {
              participantWalletAddress: participant?.walletAddress,
              participantId: participant?.id,
              surveyId: survey.id,
              researcherId: researcher?.id,
              researcherName: researcher?.name,
            });
          }}
        >
          <AccordionItem value="survey-instructions" color="black" pb={1}>
            <AccordionItemTrigger fontWeight="bold">
              Survey Instructions
            </AccordionItemTrigger>
            <AccordionItemContent>{survey.instructions}</AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
      </Box>

      <Box
        bgColor="white"
        borderRadius={10}
        pb={2}
        mb={2}
        pt={1}
        mx={2}
        px={2}
        py={2}
      >
        <AccordionRoot
          onClick={() => {
            trackAmplitudeEvent('Time duration clicked', {
              participantWalletAddress: participant?.walletAddress,
              participantId: participant?.id,
              surveyId: survey.id,
              researcherId: researcher?.id,
              researcherName: researcher?.name,
            });
          }}
          multiple
        >
          <AccordionItem value="time-duration" color="black" pb={1}>
            <AccordionItemTrigger fontWeight="bold">
              Time Duration
            </AccordionItemTrigger>
            <AccordionItemContent>
              Estimated Completion Time: {survey.durationInMinutes} minutes
            </AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
      </Box>

      <Box
        bgColor="white"
        borderRadius={10}
        pb={2}
        mb={2}
        pt={1}
        mx={2}
        px={2}
        py={2}
      >
        <AccordionRoot
          onClick={() => {
            trackAmplitudeEvent('Researcher clicked', {
              participantWalletAddress: participant?.walletAddress,
              participantId: participant?.id,
              surveyId: survey.id,
              researcherId: researcher?.id,
              researcherName: researcher?.name,
            });
          }}
          multiple
        >
          <AccordionItem value="researcher" color="black" pb={1}>
            <AccordionItemTrigger fontWeight="bold">
              Researcher
            </AccordionItemTrigger>
            <AccordionItemContent>
              <Text>Researcher: {researcher?.name || 'Loading...'}</Text>
            </AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
      </Box>

      <Button
        bgColor="#363062"
        borderRadius={15}
        px={6}
        w="3/6"
        mt={16}
        alignSelf="center"
        onClick={() => {
          if (
            survey.id &&
            survey.formLink &&
            survey.contractAddress &&
            participant?.walletAddress &&
            participant?.id &&
            participant?.gender &&
            participant?.country &&
            survey?.researcherId
          ) {
            toaster.create({
              description: 'Redirecting you to survey page, please wait ...',
              duration: 6000,
              type: 'info',
            });

            router.push(
              `${survey.formLink}?walletAddress=${participant?.walletAddress}&surveyId=${survey.id}&participantId=${participant?.id}&authId=${auth.currentUser?.uid}&gender=${participant?.gender}&country=${participant?.country}&researcherId=${survey?.researcherId}&contractAddress=${survey?.contractAddress}` ||
                '#'
            );

            trackAmplitudeEvent('Start survey clicked', {
              participantWalletAddress: participant?.walletAddress,
              participantId: participant?.id,
              surveyId: survey.id,
              researcherId: researcher?.id,
              researcherName: researcher?.name,
            });
          } else {
            toaster.create({
              description:
                'Missing required information to start survey. Refresh the page and try again.',
              duration: 6000,
              type: 'warning',
            });
          }
        }}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          {survey.isAvailable ? 'Start Survey' : 'Survey Unavailable'}
        </Text>
      </Button>
    </Flex>
  );
}
