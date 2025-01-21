'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Box, Text, Flex, Circle } from '@chakra-ui/react';
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
import { MaleAvatarC } from '@/components/avatars/male-avatar';
import { FemaleAvatarC } from '@/components/avatars/female-avatar';
import { NeverMissOutPersonC } from '@/components/images/never-miss-out-person';
import { EllipseRingsC } from '@/components/images/ellipse-rings';
import YouAreSetCard from '@/components/you-are-set-card';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';
import { AnonUserIconC } from '@/components/icons/checkmarks/anon-user';
import { CanvassingUserIconC } from '@/components/icons/checkmarks/canvassing-user';

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBeingBooked, setIsBeingBooked] = useState<Record<string, boolean>>(
    {}
  );
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const {
    participant,
    loading: participantLoading,
    getParticipant,
    ensureAnonymousAuth,
  } = useParticipantStore();

  const {
    surveys,
    fetchSurveys,
    loading: surveyLoading,
  } = useMultipleSurveysStore();

  const { rewards, fetchRewards } = useRewardStore();
  const { trackAmplitudeEvent, identifyUser } = useAmplitudeContext();

  const toasterIds = useMemo(
    () => ({
      surveyIsFullyBooked: '1',
      bookingInProgress: '2',
      bookingRecordCreationFailed: '3',
      onchainBookingFailed: '4',
      bookingSuccess: '5',
    }),
    []
  );

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Handle Amplitude tracking
  const handleAmplitudeTracking = (fetchedParticipant: Participant) => {
    const identifyEvent = new Identify();
    identifyEvent.set('[Canvassing] Surveys Taken', surveys.length);
    identifyEvent.setOnce(
      '[Canvassing] Wallet Address',
      fetchedParticipant.walletAddress
    );
    identifyEvent.setOnce('[Canvassing] Gender', fetchedParticipant.gender);
    identifyEvent.setOnce('[Canvassing] Country', fetchedParticipant.country);
    identifyEvent.set('[Canvassing] Username', fetchedParticipant.username);
    identifyEvent.setOnce(
      '[Canvassing] Time Created',
      new Date(fetchedParticipant.timeCreated.seconds * 1000).toLocaleString()
    );
    identifyEvent.setOnce('[Canvassing] Id', fetchedParticipant.id);
    identifyEvent.setOnce('[Canvassing] AuthId', fetchedParticipant.authId);
    identifyUser(identifyEvent);
  };

  // Initialize app state after auth is initialized
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!authInitialized || !isConnected || !address) {
        if (isMounted) setIsInitialized(true);
        return;
      }

      try {
        const fetchedParticipant = await getParticipant(address);
        if (!isMounted) return;

        if (fetchedParticipant) {
          // Only ensure auth if participant exists, doesn't have authId, and no current user
          if (!fetchedParticipant.authId && !auth.currentUser) {
            await ensureAnonymousAuth(fetchedParticipant);
          }

          // Fetch data in parallel
          await Promise.all([
            fetchRewards(address),
            fetchSurveys(address, chainId),
          ]);

          if (!isMounted) return;

          // Initialize booking status
          if (surveys.length > 0) {
            setIsBeingBooked(
              surveys.reduce(
                (acc, survey) => ({
                  ...acc,
                  [survey.id]: false,
                }),
                {}
              )
            );
          }

          // Handle amplitude tracking
          handleAmplitudeTracking(fetchedParticipant);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [
    authInitialized,
    isConnected,
    address,
    chainId,
    getParticipant,
    ensureAnonymousAuth,
    fetchRewards,
    fetchSurveys,
    handleAmplitudeTracking,
    surveys.length,
  ]);

  // Handle redirect after initialization
  useEffect(() => {
    if (isInitialized && !participantLoading && !participant) {
      router.replace('/welcome');
    }
  }, [isInitialized, participant, participantLoading, router]);

  const startSurveyFn = useCallback(
    async (survey: Survey) => {
      setIsBeingBooked((prev) => ({
        ...prev,
        [survey.id]: true,
      }));

      try {
        router.push(`/survey/${survey.id}`);
      } finally {
        setIsBeingBooked((prev) => ({
          ...prev,
          [survey.id]: false,
        }));
      }
    },
    [router]
  );

  /**
   * Books a survey for the participant.
   *
   * This function handles the booking process for a survey, including checking if the survey is fully booked,
   * prompting the user to approve the booking, and updating the booking status in both the blockchain and the database.
   * It also provides feedback to the user through toasters and tracks events using Amplitude.
   *
   * @param {Survey} survey - The survey to be booked.
   * @returns {Promise<void>} - A promise that resolves when the booking process is complete.
   *
   * @throws {Error} - Throws an error if the booking process fails.
   */
  const bookSurveyFn = async (survey: Survey): Promise<void> => {
    trackAmplitudeEvent('Book clicked', {
      walletAddress: address,
      surveyId: survey.id,
    });

    setIsBeingBooked((prevStatus) => ({
      ...prevStatus,
      [survey.id]: true,
    }));

    const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
      _surveyContractAddress: survey.contractAddress as Address,
      _chainId: chainId,
    });

    if (surveyIsFullyBooked) {
      toaster.create({
        id: toasterIds.surveyIsFullyBooked,
        description: 'Sorry, the survey is fully booked.',
        duration: 6000,
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

      window.location.replace('/');
      return;
    }

    try {
      toaster.create({
        id: toasterIds.bookingInProgress,
        description:
          'Booking in progress. You will now be prompted to approve the booking.',
        duration: 15000,
        type: 'info',
      });

      const screenParticipantRslt = await screenParticipantInBC({
        _smartContractAddress: survey.contractAddress as Address,
        _participantWalletAddress: participant?.walletAddress as Address,
        _chainId: chainId,
      });

      if (screenParticipantRslt.success) {
        const participantIsScreenedInDB = await screenParticipantInDB({
          _participant: participant as Participant,
          _survey: survey,
          _transactionHash: screenParticipantRslt.transactionHash as string,
        });

        if (participantIsScreenedInDB) {
          toaster.dismiss(toasterIds.bookingInProgress);
          toaster.create({
            id: toasterIds.bookingSuccess,
            description:
              'Booking success. You are being redirected to the survey page... ',
            duration: 9000,
            type: 'success',
          });

          router.push(`/survey/${survey.id}`);

          trackAmplitudeEvent('Survey booked', {
            walletAddress: address,
            surveyId: survey.id,
          });
        } else {
          toaster.dismiss(toasterIds.bookingInProgress);
          toaster.create({
            id: toasterIds.bookingRecordCreationFailed,
            description:
              'Booking record creation failed. Kindly reach out to support via the "More" tab. ',
            duration: 3000,
            type: 'warning',
          });

          router.refresh();
        }
      } else {
        toaster.dismiss(toasterIds.bookingInProgress);
        toaster.create({
          id: toasterIds.onchainBookingFailed,
          description:
            'On-chain booking failed. Kindly reach out to support via the "More" tab. ',
          duration: 6000,
          type: 'warning',
        });

        router.refresh();
      }
    } catch (error) {
      toaster.dismiss(toasterIds.bookingInProgress);
      toaster.create({
        description: 'An error occurred during booking. Try again later.',
        duration: 6000,
        type: 'warning',
      });
    } finally {
      setIsBeingBooked((prevStatus) => ({
        ...prevStatus,
        [survey.id]: false,
      }));
    }
  };

  // Show loading state while initializing
  if (!authInitialized || !isInitialized || participantLoading) {
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
    <Flex
      flexDirection={'column'}
      w={'100%'}
      bgColor={'#ECECEC'}
      px={4}
      h={'full'}
    >
      <Toaster />

      <Box position={'absolute'} top={4} right={0}>
        <EllipseRingsC />
      </Box>

      {/* {!user?.email ? (
        <Box
          h="229px"
          w="6/6"
          borderRadius={10}
          my={4}
          position="relative"
          bgColor="rgba(148, 185, 255)"
        >
          <Flex
            flexDirection="column"
            alignItems="top"
            p={4}
            h="100%"
            justifyContent="space-between"
          >
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="#363062"
              textAlign="left"
            >
              Never Miss Out
            </Text>

            <Box position="absolute" top={2} right={2}>
              <NeverMissOutPersonC />
            </Box>

            <Text fontSize="12" color="white" textAlign="left" w={'4/6'}>
              Set your email to ensure you are first to get survey invitations
            </Text>
            <Button
              bgColor={'#363062'}
              borderRadius={10}
              w={'6/6'}
              loadingText={
                <Box pr={4}>
                  <SpinnerIconC />
                </Box>
              }
            >
              <Text fontSize="8" color="white" fontWeight={'bold'}>
                Update email
              </Text>
            </Button>
          </Flex>
        </Box>
      ) : (
        <YouAreSetCard />
      )} */}

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
            {participant?.gender === 'M' ? <MaleAvatarC /> : <FemaleAvatarC />}
          </Box>

          <Box ml={4}>
            <Flex alignItems="center" mb={2}>
              <Text fontSize={18} color="white" mr={2}>
                {participant?.username || 'Userxxxx'}
              </Text>

              {user && (
                <>
                  {user.isAnonymous ? (
                    <AnonUserIconC />
                  ) : user.emailVerified ? (
                    <CanvassingUserIconC />
                  ) : null}
                </>
              )}
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

      <Box w="full" h={'full'}>
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
              bgColor={
                isBeingBooked[survey.id] || survey.isAlreadyBookedByUser
                  ? '#CDFFD8'
                  : 'white'
              }
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
                  bgColor={survey.isAlreadyBookedByUser ? 'green' : '#363062'}
                  borderRadius={20}
                  w={'1/6'}
                  mr={2}
                  loading={isBeingBooked[survey.id] as boolean}
                  loadingText={
                    <Box pr={4}>
                      <SpinnerIconC />
                    </Box>
                  }
                  disabled={Object.values(isBeingBooked).some(
                    (status) => status
                  )}
                >
                  <Text fontSize="8" color="white" mx={4}>
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
