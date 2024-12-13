'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Box, Button, VStack, Text, Flex, Link } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import useParticipantStore from '@/stores/useParticipantStore';
import useMultipleSurveysStore from '@/stores/useMultipleSurveysStore';
import useRewardStore from '@/stores/useRewardStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Identify } from '@amplitude/analytics-browser';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { address, isConnected } = useAccount();
  const {
    participant,
    loading: participantLoading,
    getParticipant,
  } = useParticipantStore();
  const {
    surveys,
    fetchSurveys,
    loading: surveyLoading,
  } = useMultipleSurveysStore();
  const router = useRouter();

  const { rewards, fetchRewards } = useRewardStore();
  const { trackAmplitudeEvent, identifyUser } = useAmplitudeContext();

  useEffect(() => {
    if (address) {
      fetchRewards(address);
    }
  }, [address, isConnected, fetchRewards]);

  // Check participant status when wallet is connected
  const checkParticipantStatus = useCallback(async () => {
    if (isConnected && address) {
      await getParticipant(address);

      await fetchSurveys(address);

      if (surveys && participant) {
        const identifyEvent = new Identify();
        identifyEvent.set('[Canvassing] Surveys Taken', surveys.length);
        identifyEvent.setOnce('[Canvassing] Wallet Address', participant.walletAddress);
        identifyEvent.setOnce('[Canvassing] Gender', participant.gender);
        identifyEvent.setOnce('[Canvassing] Country', participant.country);
        identifyEvent.setOnce('[Canvassing] Username', participant.username);
        identifyEvent.setOnce(
          '[Canvassing] Time Created',
          new Date(participant.timeCreated.seconds * 1000).toLocaleString()
        );
        identifyEvent.setOnce('[Canvassing] Id', participant.id);

        identifyUser(identifyEvent);
      }
    }
  }, [isConnected, address, getParticipant]);

  // Initial setup effect
  useEffect(() => {
    const initialize = async () => {
      await checkParticipantStatus();
      setIsInitialized(true);
    };

    initialize();
  }, [checkParticipantStatus, fetchSurveys, surveys.length]);

  // Handle redirect after initialization
  useEffect(() => {
    if (isInitialized && !participantLoading && !participant) {
      router.replace('/welcome');
    }
  }, [isInitialized, participant, participantLoading, router]);

  // Show loading state while initializing or checking participant
  if (!isInitialized || participantLoading) {
    return (
      <Flex
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        justify="center"
        align="center"
        bg="white"
        zIndex="50"
      >
        <SpinnerIconC />
      </Flex>
    );
  }

  if (!participant) {
    return null;
  }

  return (
    <Flex flexDirection={'column'} w={'100%'} bgColor={'#ECECEC'} px={4}>
      <Flex justify="flex-start">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="#363062"
          textAlign="left"
          py={3}
        >
          Hello!
        </Text>
      </Flex>
      <Box
        bgColor="#363062"
        h="25"
        w="5/6"
        borderTopLeftRadius={40}
        borderTopRightRadius={20}
        borderBottomLeftRadius={20}
        borderBottomRightRadius={20}
      >
        <Flex flexDirection="row" alignItems="top" p={4}>
          <Box>
            <Avatar variant="solid" size="lg" bgColor="white" color={'black'} />
          </Box>

          <Box ml={4}>
            <Flex alignItems="center" mb={2}>
              <Text fontSize={18} color="white" mr={2}>
                {participant?.username || 'Userxxxx'}
              </Text>
            </Flex>
            <Text fontSize={14} mb={2} color="white">
              Surveys completed: {rewards.length}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Flex justify="flex-start">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="#363062"
          textAlign="left"
          py={3}
        >
          Available Surveys
        </Text>
      </Flex>

      <Box w="full" h="100vh">
        {surveyLoading ? (
          <Flex justify="center" align="center" h="100%">
            <SpinnerIconC />
          </Flex>
        ) : surveys.length > 0 ? (
          surveys.map((survey) => (
            <Link key={survey.id} href={`survey/${survey.id}`}>
              <Box
                bgColor="white"
                h="25"
                w="full"
                borderRadius={10}
                flexDirection={'column'}
                pb={2}
                mb={4}
                mt={0}
                pt={1}
                onClick={() => {
                  trackAmplitudeEvent('Survey clicked', {
                    walletAddress: address,
                    surveyId: survey.id,
                  });
                }}
              >
                <Box bgColor="#CFCED8" h="30" borderRadius={10} mx={2}>
                  <Flex
                    flexDirection="column"
                    alignItems="top"
                    pl={2}
                    pt={2}
                    mt={1}
                  >
                    <Text fontSize={'larger'} mb={2} color="#363062">
                      {survey.topic}
                    </Text>
                    <Text fontSize={'sm'} mb={2} color="black">
                      {survey.brief}
                    </Text>
                  </Flex>
                </Box>
                <Flex
                  flexDirection="row"
                  pl={2}
                  pt={2}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                >
                  <Flex
                    flexDirection="row"
                    justifyContent={'start'}
                    alignItems={'center'}
                  >
                    <Text fontSize={'lg'} color="green">
                      ${survey.rewardAmountIncUSD}
                    </Text>

                    <Text fontSize={'lg'} color="grey" pl={1}>
                      per survey
                    </Text>
                  </Flex>

                  <Button
                    bgColor={'#363062'}
                    borderRadius={20}
                    w={'1/6'}
                    mr={1}
                  >
                    <Text fontSize="8" color="white">
                      Start
                    </Text>
                  </Button>
                </Flex>
              </Box>
            </Link>
          ))
        ) : (
          <Box
            bgColor="gray.100"
            h="25"
            w="full"
            borderRadius={10}
            p={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize="lg" color="gray.500">
              No surveys available
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
