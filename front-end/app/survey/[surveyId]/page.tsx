'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { Box, Image, Button, Text, Flex } from '@chakra-ui/react';
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from '@/components/ui/accordion';
import useSingleSurveyStore from '@/stores/useSingleSurveyStore';

import useParticipantStore from '@/stores/useParticipantStore';
import { useRouter } from 'next/navigation';
import useSingleResearcherStore from '@/stores/useResearcherStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';

export default function SurveyPage() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const pathname = usePathname();
  const surveyId = pathname?.split('/').pop(); // Extract surveyId from the URL
  const { trackAmplitudeEvent } = useAmplitudeContext();

  const router = useRouter();

  const { survey, loading, fetchSurvey } = useSingleSurveyStore();
  const { researcher, fetchResearcher } = useSingleResearcherStore();
  const { participant } = useParticipantStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
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
      <Flex justify="center" align="center" minH="100vh">
        <SpinnerIconC />
      </Flex>
    );
  if (loading)
    return (
      <Flex justify="center" align="center" minH="100vh">
        <SpinnerIconC />
      </Flex>
    );
  if (!survey)
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Text>Survey not found</Text>
      </Flex>
    );

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC">
      {/* <Box
        width="100%"
        height={300}
        bgColor="#CEDDF9"
        borderBottomLeftRadius={15}
        borderBottomRightRadius={15}
      >
        <Image
          src="/instructional-manual.png"
          alt="Background"
          width="100%"
          height={300}
          objectFit="contain"
          blur="md"
        />
      </Box> */}

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
              partipantId: participant?.id,
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
              partipantId: participant?.id,
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
              partipantId: participant?.id,
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
          router.push(
            `${survey.formLink}?walletAddress=${participant?.walletAddress}&surveyId=${survey.id}` ||
              '#'
          );

          trackAmplitudeEvent('Start survey clicked', {
            participantWalletAddress: participant?.walletAddress,
            partipantId: participant?.id,
            surveyId: survey.id,
            researcherId: researcher?.id,
            researcherName: researcher?.name,
          });
        }}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          {survey.isAvailable ? 'Start Survey' : 'Survey Unavailable'}
        </Text>
      </Button>
    </Flex>
  );
}
