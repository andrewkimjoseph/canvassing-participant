"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Box, Text, Flex } from "@chakra-ui/react";
import useParticipantStore from "@/stores/useParticipantStore";
import useMultipleSurveysStore from "@/stores/useMultipleSurveysStore";
import useRewardStore from "@/stores/useRewardStore";
import useAmplitudeContext from "@/hooks/useAmplitudeContext";
import { SpinnerIconC } from "@/components/icons/spinner-icon";
import { Identify } from "@amplitude/analytics-browser";
import { screenParticipantInDB } from "@/services/db/screenParticipantInDB";
import {
  screenParticipantInBC,
  ScreenParticipantResult,
} from "@/services/web3/screenParticipantInBC";
import { Survey } from "@/entities/survey";
import { Address } from "viem";
import { Participant } from "@/entities/participant";
import { checkIfSurveyIsFullyBooked } from "@/services/web3/checkIfSurveyIsAtMaxParticipants";
import { Toaster, toaster } from "@/components/ui/toaster";
import { MaleAvatarC } from "@/components/avatars/male-avatar";
import { FemaleAvatarC } from "@/components/avatars/female-avatar";
import { EllipseRingsC } from "@/components/images/ellipse-rings";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, functions } from "@/firebase";
import { AnonUserIconC } from "@/components/icons/checkmarks/anon-user";
import { CanvassingUserIconC } from "@/components/icons/checkmarks/canvassing-user";
import { generateTempSignature } from "@/services/web3/generateTempSignature";
import { SwitchButtonIcon } from "@/components/icons/switch-button-icon";
import { BlueDollarIcon } from "@/components/icons/blue-dollar-icon";
import { GreenDollarIcon } from "@/components/icons/green-dollar-icon";
import useRewardTokenStore from "@/stores/useRewardTokenStore";
import { RewardToken } from "@/types/rewardToken";
import { formatTokenAmount } from "@/utils/formatTokenAmount";
import { TempSigningResult } from "@/types/tempSigningResult";
import { HttpsCallableResult } from "firebase/functions";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { BotUserIconC } from "@/components/icons/checkmarks/bot-user";
import { Chip } from "@heroui/chip";
import useGoodDollarIdentityStore from "@/stores/useGoodDollarIdentityStore";

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBeingBooked, setIsBeingBooked] = useState<Record<string, boolean>>(
    {}
  );
  const identitySDK = useIdentitySDK("production");

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

  const { currentToken, setCurrentToken } = useRewardTokenStore();

  const { rewards, fetchRewards } = useRewardStore();
  const { trackAmplitudeEvent, identifyUser } = useAmplitudeContext();
  const { setIsWhitelisted, setRoot, isWhitelisted, root } =
    useGoodDollarIdentityStore();

  const toasterIds = useMemo(
    () => ({
      surveyIsFullyBooked: "1",
      bookingInProgress: "2",
      bookingRecordCreationFailed: "3",
      onchainBookingFailed: "4",
      bookingSuccess: "5",
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
    identifyEvent.set("[Canvassing] Surveys Taken", rewards.length);
    identifyEvent.setOnce(
      "[Canvassing] Wallet Address",
      fetchedParticipant.walletAddress
    );
    identifyEvent.setOnce("[Canvassing] Gender", fetchedParticipant.gender);
    identifyEvent.setOnce("[Canvassing] Country", fetchedParticipant.country);
    identifyEvent.set("[Canvassing] Username", fetchedParticipant.username);
    identifyEvent.setOnce("[Canvassing] Id", fetchedParticipant.id);
    identifyEvent.setOnce("[Canvassing] AuthId", fetchedParticipant.authId);
    identifyUser(identifyEvent);
  };

  const checkWhitelistedRoot = async () => {
    console.log("isWhitelisted", isWhitelisted);
    console.log("root", root);
    if (isWhitelisted === null) {
      if (address) {
        const result = await identitySDK?.getWhitelistedRoot(address);

        setIsWhitelisted(result?.isWhitelisted || false);
        if (result?.root) {
          setRoot(result.root);
        }
        console.log(
          `Is Whitelisted: ${result?.isWhitelisted}, Root: ${result?.root}`
        );
      }
    }
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
            fetchRewards(address, chainId),
            fetchSurveys(chainId, rewards, currentToken),
            checkWhitelistedRoot(),
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
        } else {
          router.replace("/welcome");
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [authInitialized, isConnected, address, chainId, currentToken]);

  // Handle redirect after initialization
  useEffect(() => {
    if (isInitialized && !participantLoading && !participant) {
      router.replace("/welcome");
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
   * Module for survey booking functionality
   *
   * This refactoring breaks down the original bookSurveyFn into smaller,
   * more focused functions while maintaining the same overall behavior.
   */

  /**
   * Books a survey for the participant.
   *
   * This function orchestrates the booking process by coordinating several sub-functions
   * that each handle a specific part of the booking flow.
   *
   * @param {Survey} survey - The survey to be booked.
   * @returns {Promise<void>} - A promise that resolves when the booking process is complete.
   */
  const bookSurveyFn = async (survey: Survey): Promise<void> => {
    // Track initial booking attempt
    trackAmplitudeEvent("Book clicked", {
      walletAddress: address,
      surveyId: survey.id,
    });

    // Set booking status to reflect UI changes
    setIsBeingBooked((prevStatus) => ({
      ...prevStatus,
      [survey.id]: true,
    }));

    try {
      // Step 1: Check if survey is still available for booking
      const isAvailable = await checkSurveyAvailability(survey);
      if (!isAvailable) {
        return; // Early return, availability check handles UI updates
      }

      // Step 2: Generate signature required for blockchain transaction
      const signatureResult = await prepareBookingSignature(survey);
      if (!signatureResult.data.success) {
        throw new Error("Failed to generate signature for screening");
      }

      // Step 3: Process the blockchain transaction
      const blockchainResult = await processBlockchainBooking(
        survey,
        signatureResult.data
      );
      if (!blockchainResult.success) {
        handleBlockchainFailure(survey);
        return;
      }

      // Step 4: Update database records
      const databaseUpdateSuccessful = await updateBookingDatabase(
        survey,
        blockchainResult,
        signatureResult.data
      );
      if (!databaseUpdateSuccessful) {
        handleDatabaseFailure(survey);
        return;
      }

      // Step 5: Handle successful booking
      handleSuccessfulBooking(survey);
    } catch (error) {
      // Handle any unexpected errors
      handleBookingError(error);
    } finally {
      // Always reset booking status
      setIsBeingBooked((prevStatus) => ({
        ...prevStatus,
        [survey.id]: false,
      }));
    }
  };

  /**
   * Checks if a survey is available for booking.
   *
   * @param {Survey} survey - The survey to check
   * @returns {Promise<boolean>} - True if available, false if fully booked
   */
  const checkSurveyAvailability = async (survey: Survey): Promise<boolean> => {
    const surveyIsFullyBooked = await checkIfSurveyIsFullyBooked({
      _surveyContractAddress: survey.contractAddress as Address,
      _chainId: chainId,
    });

    if (surveyIsFullyBooked) {
      toaster.create({
        id: toasterIds.surveyIsFullyBooked,
        description: "Sorry, the survey is fully booked.",
        duration: 6000,
        type: "error",
      });

      trackAmplitudeEvent("Survey fully booked", {
        walletAddress: address,
        surveyId: survey.id,
      });

      window.location.replace("/");
      return false;
    }

    // Notify user that booking is in progress
    toaster.create({
      id: toasterIds.bookingInProgress,
      description:
        "Booking in progress. You will now be prompted to approve the booking.",
      duration: 15000,
      type: "info",
    });

    return true;
  };

  /**
   * Prepares the signature needed for the blockchain transaction.
   *
   * @param {Survey} survey - The survey being booked
   * @returns {Promise<SignatureResult>} - The signature result
   */
  const prepareBookingSignature = async (
    survey: Survey
  ): Promise<HttpsCallableResult<TempSigningResult>> => {
    return await generateTempSignature({
      surveyContractAddress: survey.contractAddress as Address,
      chainId: chainId,
      participantWalletAddress: participant?.walletAddress as Address,
      surveyId: survey.id,
      network: process.env.NEXT_PUBLIC_NETWORK || "mainnet",
    });
  };

  /**
   * Executes the blockchain transaction for booking.
   *
   * @param {Survey} survey - The survey being booked
   * @param {SignatureResult} signatureResult - The signature to use
   * @returns {Promise<BlockchainResult>} - The blockchain transaction result
   */
  const processBlockchainBooking = async (
    survey: Survey,
    signatureResult: TempSigningResult
  ): Promise<ScreenParticipantResult> => {
    return await screenParticipantInBC({
      _smartContractAddress: survey.contractAddress as Address,
      _participantWalletAddress: participant?.walletAddress as Address,
      _chainId: chainId,
      _signature: signatureResult.signature as string,
      _nonce: BigInt(signatureResult.nonce as string),
      _surveyId: survey.id,
    });
  };

  /**
   * Updates the database with booking information.
   *
   * @param {Survey} survey - The survey being booked
   * @param {BlockchainResult} blockchainResult - Blockchain transaction result
   * @param {SignatureResult} signatureResult - Signature information
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  const updateBookingDatabase = async (
    survey: Survey,
    blockchainResult: ScreenParticipantResult,
    signatureResult: TempSigningResult
  ): Promise<boolean> => {
    return await screenParticipantInDB({
      _participant: participant as Participant,
      _survey: survey,
      _transactionHash: blockchainResult.transactionHash as string,
      _signature: signatureResult.signature as string,
      _nonce: signatureResult.nonce as string,
    });
  };

  /**
   * Handles successful booking completion.
   *
   * @param {Survey} survey - The booked survey
   */
  const handleSuccessfulBooking = (survey: Survey): void => {
    toaster.dismiss(toasterIds.bookingInProgress);
    toaster.create({
      id: toasterIds.bookingSuccess,
      description:
        "Booking success. You are being redirected to the survey page... ",
      duration: 9000,
      type: "success",
    });

    router.push(`/survey/${survey.id}`);

    trackAmplitudeEvent("Survey booked", {
      walletAddress: address,
      surveyId: survey.id,
    });
  };

  /**
   * Handles failure during blockchain transaction.
   *
   * @param {Survey} survey - The survey being booked
   */
  const handleBlockchainFailure = (survey: Survey): void => {
    toaster.dismiss(toasterIds.bookingInProgress);
    toaster.create({
      id: toasterIds.onchainBookingFailed,
      description:
        'On-chain booking failed. Kindly reach out to support via the "More" tab. ',
      duration: 6000,
      type: "warning",
    });

    trackAmplitudeEvent("Survey on-chain booking failed", {
      walletAddress: address,
      surveyId: survey.id,
    });

    router.refresh();
  };

  /**
   * Handles failure during database update.
   *
   * @param {Survey} survey - The survey being booked
   */
  const handleDatabaseFailure = (survey: Survey): void => {
    toaster.dismiss(toasterIds.bookingInProgress);
    toaster.create({
      id: toasterIds.bookingRecordCreationFailed,
      description:
        'Booking record creation failed. Kindly reach out to support via the "More" tab. ',
      duration: 3000,
      type: "warning",
    });

    trackAmplitudeEvent("Survey booking record creation failed", {
      walletAddress: address,
      surveyId: survey.id,
    });

    router.refresh();
  };

  /**
   * Handles unexpected errors during booking.
   *
   * @param {unknown} error - The error that occurred
   */
  const handleBookingError = (error: unknown): void => {
    console.error("Booking error:", error);
    toaster.dismiss(toasterIds.bookingInProgress);
    toaster.create({
      description: "An error occurred during booking. Try again later.",
      duration: 6000,
      type: "warning",
    });
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
      flexDirection={"column"}
      w={"100%"}
      bgColor={"#ECECEC"}
      px={4}
      h={"full"}
    >
      <Toaster />

      <Box position={"absolute"} top={4} right={0}>
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

      <Flex justify="space-between" flexDirection="row" py={3}>
        <Text fontSize="3xl" fontWeight="bold" color="black" textAlign="left">
          Dashboard
        </Text>

        <Button
          bgColor={
            currentToken === RewardToken.celoDollar ? "#82CEB9" : "#7DC2E8"
          }
          borderRadius={8}
          w={"2/6"}
          borderWidth={1}
          borderColor={
            currentToken === RewardToken.celoDollar ? "#0ECE8B" : "#02B1FF"
          }
          onClick={() => {
            setCurrentToken(
              currentToken === RewardToken.celoDollar
                ? RewardToken.goodDollar
                : RewardToken.celoDollar
            );
          }}
        >
          <Text fontSize="8" color="white">
            {currentToken === RewardToken.celoDollar ? "cUSD" : "G$"}
          </Text>
          {currentToken === RewardToken.celoDollar ? (
            <GreenDollarIcon />
          ) : (
            <BlueDollarIcon />
          )}

          <SwitchButtonIcon />
        </Button>
      </Flex>

      <Box
        bgColor="#625C89"
        h="25"
        w="6/6"
        borderWidth={1}
        borderColor={"#363062"}
        borderRadius={20}
      >
        <Flex flexDirection="row" alignItems="top" p={4}>
          <Box>
            {participant?.gender === "M" ? <MaleAvatarC /> : <FemaleAvatarC />}
          </Box>

          <Box ml={4}>
            <Flex alignItems="center" mb={2}>
              <Text fontSize={18} color="white" mr={2}>
                {participant?.username || "Userxxxx"}
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
              {isWhitelisted === false && (
                <Box ml={1} flexDirection="row">
                  <BotUserIconC />
                </Box>
              )}
              {isWhitelisted === false && (
                <Box ml={1} flexDirection="row">
                  <Chip
                    onClick={async () => {
                      const link = await identitySDK?.generateFVLink(
                        false,
                        window.location.href,
                        chainId
                      );
                      if (link) {
                        window.location.href = link;
                      }
                    }}
                    size="sm"
                  >
                    Get verified
                  </Chip>
                </Box>
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
          Available Surveys (
          {currentToken === RewardToken.celoDollar ? "cUSD" : "G$"})
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
              bgColor={
                isBeingBooked[survey.id] || survey.isAlreadyBookedByUser
                  ? "#CDFFD8"
                  : "white"
              }
              h="25"
              w="full"
              borderRadius={10}
              flexDirection={"column"}
              pb={2}
              mb={4}
              mt={0}
              pt={1}
              onClick={() => {
                trackAmplitudeEvent("Survey clicked", {
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
                  <Text fontSize={"larger"} mb={2} color="#363062">
                    {survey.topic}
                  </Text>
                  <Text fontSize={"sm"} mb={2} color="black">
                    {survey.brief}
                  </Text>
                </Flex>
              </Box>
              <Flex
                flexDirection="row"
                pl={2}
                pt={2}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Flex
                  flexDirection="row"
                  justifyContent={"start"}
                  alignItems={"center"}
                >
                  <Text fontSize={"lg"} color="green">
                    {survey.rewardToken === RewardToken.celoDollar
                      ? "cUSD"
                      : "G$"}{" "}
                    {formatTokenAmount(survey?.rewardAmountIncUSD as number)}
                  </Text>

                  <Text fontSize={"lg"} color="grey" pl={1}>
                    per survey
                  </Text>
                </Flex>

                <Button
                  bgColor={survey.isAlreadyBookedByUser ? "green" : "#363062"}
                  borderRadius={20}
                  w={"1/6"}
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
                    {survey.isAlreadyBookedByUser ? "Start" : "Book"}
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
