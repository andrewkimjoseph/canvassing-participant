'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Box, Text, Flex } from '@chakra-ui/react';
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
import { auth } from '@/firebase';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  User,
} from 'firebase/auth';
import { GoogleIcon } from '@/components/icons/google-icon';

const googleAuthProvider = new GoogleAuthProvider();

googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBeingBooked, setIsBeingBooked] = useState<{
    [key: string]: boolean;
  }>({});

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
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

  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const toasterIds = {
    surveyIsFullyBooked: '1',
    bookingInProgress: '2',
    bookingRecordCreationFailed: '3',
    onchainBookingFailed: '4',
    bookingSuccess: '5',
  };

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

  // Modify the Google sign-in click handler
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      console.log('Starting Google sign in process...');

      // Check if we're on localhost
      if (
        typeof window !== 'undefined' &&
        window.location.hostname === 'localhost'
      ) {
        console.log('Using popup sign-in for localhost');
        const result = await signInWithPopup(auth, googleAuthProvider);
        console.log('Popup sign-in successful:', result.user.email);

        toaster.create({
          description: `Signed in as ${result.user.email}`,
          duration: 3000,
          type: 'success',
        });
      } else {
        console.log('Using redirect sign-in for production');
        await signInWithRedirect(auth, googleAuthProvider);
      }
    } catch (error: any) {
      console.error('Error during sign in:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Another sign-in attempt is in progress.';
      }

      toaster.create({
        description: errorMessage,
        duration: 3000,
        type: 'error',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Update auth state monitor
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        console.log('User signed in:', firebaseUser.email);
        // You might want to update your participant data here
        if (participant) {
          // Add logic to update participant with Google auth info
          // This would depend on your DB structure and requirements
        }
      } else {
        console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, [address, participant]);

  // Update the redirect result handler
  useEffect(() => {
    const handleRedirectResult = async () => {
      console.log('Checking for redirect result...'); // Debug log 1
      try {
        console.log('Before getRedirectResult call'); // Debug log 2
        const result = await getRedirectResult(auth);
        console.log('After getRedirectResult call:', result); // Debug log 3

        if (result) {
          const user = result.user;
          console.log('Successfully signed in user:', user); // Debug log 4

          toaster.create({
            description: `Signed in as ${user.email}`,
            duration: 3000,
            type: 'success',
          });
        } else {
          console.log(
            'No redirect result found - this is normal if not returning from a redirect'
          ); // Debug log 5
        }
      } catch (error: any) {
        console.error('Error handling redirect:', error); // Debug log 6
        console.error('Error code:', error.code); // Debug log 7
        console.error('Error message:', error.message); // Debug log 8

        let errorMessage = 'Failed to sign in with Google. Please try again.';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Another sign-in attempt is in progress.';
        }

        toaster.create({
          description: errorMessage,
          duration: 3000,
          type: 'error',
        });
      }
    };

    handleRedirectResult();
  }, []);

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
  };

  const bookSurveyFn = async (survey: Survey) => {
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
              'Booking record creation failed.  Kindly reach out to support via the "More" tab. ',
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
        description: 'An error occured during booking. Try again later.',
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
            fontSize="2xl"
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
            Sign up with Google to ensure you are first to get survey
            invitations
          </Text>
          <Button
            bgColor={'#363062'}
            borderRadius={10}
            w={'6/6'}
            onClick={handleGoogleSignIn}
            loading={isSigningIn}
            loadingText={
              <Box pr={4}>
                <SpinnerIconC />
              </Box>
            }
            disabled={isSigningIn}
          >
            <GoogleIcon />
            <Text fontSize="8" color="white" fontWeight={'bold'}>
              Continue with Google
            </Text>
          </Button>
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
          Hello!
        </Text>
      </Flex>

      {/* <Box
        h="200px"
        w="6/6"
        borderRadius={10}
        mb={4}
        position="relative"
        bgColor="rgba(148, 185, 255, 0.75)"
      >
        <Flex flexDirection="column" alignItems="top" p={4}>
          <Text
            fontSize="2xl"
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
            Update your email to ensure you’re the first to get survey
            invitations
          </Text>

          <Button
            bgColor={'#363062'}
            borderRadius={10}
            w={'6/6'}
            mt={6}
            mb={2}
            loadingText={
              <Box pr={4}>
                <SpinnerIconC />
              </Box>
            }
            disabled={Object.values(isBeingBooked).some((status) => status)}
          >
            <Text fontSize="8" color="white" mx={4} fontWeight={'bold'}>
              Update Now
            </Text>
          </Button>
        </Flex>
      </Box> */}
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
