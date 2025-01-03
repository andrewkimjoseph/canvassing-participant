'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Box, Text, Flex, Link } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import useParticipantStore from '@/stores/useParticipantStore';
import useMultipleSurveysStore from '@/stores/useMultipleSurveysStore';
import useRewardStore from '@/stores/useRewardStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Identify } from '@amplitude/analytics-browser';
import { screenParticipantInDB } from '@/services/db/screenParticipantInDB';
import { screenParticipantInBC } from '@/services/web3/screenParticipantInBC';
import { Survey } from '@/entities/survey';
import { Address } from 'viem';
import { Participant } from '@/entities/participant';
import { checkIfSurveyIsFullyBooked } from '@/services/web3/checkIfSurveyIsFullyBooked';
import { Toaster, toaster } from '@/components/ui/toaster';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBeingBooked, setIsBeingBooked] = useState<{
    [key: string]: boolean;
  }>({});

  const { address, isConnected } = useAccount();
  const chainId = useChainId()
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

      await fetchSurveys(address, chainId);

      if (surveys && participant) {
        const identifyEvent = new Identify();
        identifyEvent.set('[Canvassing] Surveys Taken', surveys.length);
        identifyEvent.setOnce(
          '[Canvassing] Wallet Address',
          participant.walletAddress
        );
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

  useEffect(() => {
    if (surveys.length > 0) {
      const initialStatus = surveys.reduce((acc, survey) => {
        acc[survey.id] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      setIsBeingBooked(initialStatus);
    }
  }, [surveys]);

  const startSurveyFn = async (survey: Survey) => {
    setIsBeingBooked((prevStatus) => ({
      ...prevStatus,
      [survey.id]: true,
    }));
    router.push(`/survey/${survey.id}`);
    setIsBeingBooked((prevStatus) => ({
      ...prevStatus,
      [survey.id]: false,
    }));
  }

  const bookSurveyFn = async (survey: Survey) => {
    setIsBeingBooked((prevStatus) => ({
      ...prevStatus,
      [survey.id]: true,
    }));

    const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
      _surveyContractAddress: survey.contractAddress as Address,
      _chainId: chainId
    });

    if (surveyIsFullyBooked) {
      toaster.create({
        description: 'Sorry, the survey is fully booked.',
        duration: 3000,
        type: 'error',
      });

      trackAmplitudeEvent('Survey fully booked', {
        walletAddress: address,
        surveyId: survey.id,
      });

      setIsBeingBooked((prevStatus) => ({
        ...prevStatus,
        [survey.id]: false,
      }));

      window.location.replace("/");
      return;
    }

    try {
      const screenParticipantRslt = await screenParticipantInBC({
        _smartContractAddress: survey.contractAddress as Address,
        _participantWalletAddress: participant?.walletAddress as Address,
        _chainId: chainId
      });

      if (screenParticipantRslt.success) {
        const participantIsScreenedInDB = await screenParticipantInDB({
          _participant: participant as Participant,
          _survey: survey,
          _transactionHash: screenParticipantRslt.transactionHash as string,
        });

        if (participantIsScreenedInDB) {

          toaster.create({
            description:
              'Booking success. You are being redirected to the survey page... ',
            duration: 3000,
            type: 'success',
          });
       
          router.push(`/survey/${survey.id}`);

          trackAmplitudeEvent('Survey booked', {
            walletAddress: address,
            surveyId: survey.id,
          });
        } else {
          toaster.create({
            description:
              'Booking record creation failed.  Kindly reach out to support via the "More" tab. ',
            duration: 3000,
            type: 'error',
          });

          router.refresh();
        }
      } else {
        toaster.create({
          description:
            'On-chain booking failed. Kindly reach out to support via the "More" tab. ',
          duration: 3000,
          type: 'error',
        });

        router.refresh();
      }
    } catch (error) {
      toaster.create({
        description: 'An error occured during booking. Try again later.',
        duration: 3000,
        type: 'error',
      });
    } finally {
      setIsBeingBooked((prevStatus) => ({
        ...prevStatus,
        [survey.id]: false,
      }));
    }
  };

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
    <Flex flexDirection={'column'} w={'100%'} bgColor={'#ECECEC'} px={4} h={"full"}>
      <Toaster />

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

      <Box w="full" h={"full"}>
        
        {surveys.length > 0 && !surveyLoading && (
          <Flex justify="flex-start">
            <Text
              fontSize="lg"
              fontWeight="normal"
              color="gray"
              textAlign="left"
              pb={3}
            >
              Book/start any survey to continue ...
            </Text>
          </Flex>
        )}
        {surveyLoading ? (
          <Flex justify="center">
            <SpinnerIconC />
          </Flex>
        ) : surveys.length > 0 ? (
          surveys.map((survey) => (
            <Box
              key={survey.id}
              bgColor={isBeingBooked[survey.id] || survey.isAlreadyBookedByUser ? '#CDFFD8' : 'white'}
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

                if (survey.isAlreadyBookedByUser) {
                  startSurveyFn(survey);
                } else {
                  bookSurveyFn(survey);
                }
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
                  bgColor={survey.isAlreadyBookedByUser ? "green": "#363062"}
                  borderRadius={20}
                  w={'1/6'}
                  mr={2}
                  loading={isBeingBooked[survey.id] as boolean}
                  loadingText={<Box pr={4}>
                    <SpinnerIconC />
                  </Box>}
                  disabled={Object.values(isBeingBooked).some(
                    (status) => status
                  )}
                >
                  <Text fontSize="8" color="white">
                    {survey.isAlreadyBookedByUser ? 'Start' : 'Book'}
                  </Text>
                </Button>
              </Flex>
            </Box>
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
