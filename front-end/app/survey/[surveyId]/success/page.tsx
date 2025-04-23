"use client";

import { useEffect, useState } from "react";

import { useAccount, useChainId } from "wagmi";

import { Box, Image, Text, Flex, Spinner } from "@chakra-ui/react";

import { useParams, useSearchParams } from "next/navigation";
import { processRewardClaimByParticipant } from "@/services/web3/processRewardClaimByParticipant";
import { Address } from "viem";
import { Toaster, toaster } from "@/components/ui/toaster";
import useSingleSurveyStore from "@/stores/useSingleSurveyStore";
import { Button } from "@/components/ui/button";
import { getTokenContractBalance } from "@/services/web3/checkTokenContractBalance";
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
} from "firebase/firestore";
import { db } from "@/firebase";
import useParticipantStore from "@/stores/useParticipantStore";
import useAmplitudeContext from "@/hooks/useAmplitudeContext";
import { SpinnerIconC } from "@/components/icons/spinner-icon";
import { Reward } from "@/entities/reward";
import { Survey } from "@/entities/survey";
import { RewardToken } from "@/types/rewardToken";
import useRewardTokenStore from "@/stores/useRewardTokenStore";
import { formatTokenAmount } from "@/utils/formatTokenAmount";

export default function SuccessPage() {
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const { address, isConnected } = useAccount();
  const { survey, fetchSurvey } = useSingleSurveyStore();
  const [isProcessingRewardClaim, setIsProcessingRewardClaim] = useState(false);

  const { participant } = useParticipantStore.getState();
  const params = useParams();
  const { trackAmplitudeEvent } = useAmplitudeContext();
  const { currentToken } = useRewardTokenStore();

  const surveyId = params.surveyId;

  const toasterIds = {
    invalidOrUndetectedSurveyId: "1",
    surveyDoesNotExist: "2",
    connectionLost: "3",
    rewardRecordNotFound: "4",
    notEnoughBalance: "5",
    claimProcessInitiated: "6",
    rewardRecordFound: "7",
    rewardClaimedSuccessfully: "8",
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
      fetchSurvey(surveyId as string, chainId);
    }
  }, [surveyId, fetchSurvey, chainId]);

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
    // Set processing state to prevent multiple claim attempts
    setIsProcessingRewardClaim(true);

    // VALIDATION SECTION
    // Step 1: Validate survey ID existence and format
    if (!surveyId || typeof surveyId !== "string") {
      toaster.create({
        id: toasterIds.invalidOrUndetectedSurveyId,
        description:
          'Survey id was not detected or is invalid. Contact support via "More".',
        duration: 4500,
        type: "error",
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    // Step 2: Validate wallet connection status
    if (!isConnected) {
      toaster.create({
        id: toasterIds.connectionLost,
        description:
          "Connection lost. Refresh this page and try claiming again.",
        duration: 4500,
        type: "warning",
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    // DATABASE VALIDATION SECTION
    // Step 3: Validate survey exists in database
    const surveySnapshot = await getDoc(doc(db, "surveys", surveyId));

    if (!surveySnapshot.exists()) {
      toaster.create({
        id: toasterIds.surveyDoesNotExist,
        description: 'Survey does not exist. Contact support via "More".',
        duration: 4500,
        type: "error",
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    const fetchedSurvey = surveySnapshot.data() as Survey;

    // BLOCKCHAIN VALIDATION SECTION
    // Step 4: Check if contract has sufficient balance to pay the reward
    const contractBalance = await getTokenContractBalance(address, {
      _contractAddress: fetchedSurvey.contractAddress as Address,
      _chainId: chainId,
      _token: currentToken,
    });

    if (contractBalance < (fetchedSurvey.rewardAmountIncUSD as number)) {
      toaster.dismiss(); // Clear any existing toasts
      toaster.create({
        id: toasterIds.notEnoughBalance,
        description:
          'Not enough balance to pay you out. Contact support via "More".',
        duration: 6000,
        type: "warning",
      });
      setIsProcessingRewardClaim(false);
      return;
    }

    // CLAIM PROCESS SECTION
    // Step 5: Notify user that claim process has started
    toaster.create({
      id: toasterIds.claimProcessInitiated,
      description: "Claim process initiated. Please wait ...",
      duration: 15000,
      type: "info",
    });

    // Add a small delay to allow the user to see the notification
    // This also helps spread out sequential operations for better UX
    await new Promise((resolve) => setTimeout(resolve, 5250));

    // Step 6: Find the reward record in the database
    const rewardsQuery = query(
      collection(db, "rewards"),
      where("surveyId", "==", surveyId),
      where("participantId", "==", participant?.id)
    );

    const rewardQueryDocs = await getDocs(rewardsQuery);

    // Handle case where reward record does not exist
    if (rewardQueryDocs.empty) {
      toaster.dismiss(toasterIds.claimProcessInitiated);
      toaster.create({
        id: toasterIds.rewardRecordNotFound,
        description: 'Reward record not found. Contact support via "More".',
        duration: 4500,
        type: "warning",
      });
      setIsProcessingRewardClaim(false);
      return;
    } else {
      // Clear the "processing" toast as we're moving to next step
      toaster.dismiss(toasterIds.claimProcessInitiated);
    }

    // Step 7: Notify user that reward record was found and prepare for blockchain interaction
    toaster.create({
      id: toasterIds.rewardRecordFound,
      description:
        "Reward record found. You will now be prompted to approve the claim request.",
      duration: 15000,
      type: "success",
    });

    // Get reference to the reward document for later update
    const rewardRef = rewardQueryDocs.docs[0].ref;

    try {
      // Step 8: Get fresh data from server to ensure we have the latest state
      // This prevents potential issues with cached or stale data
      const reward = (
        await getDocsFromServer(rewardsQuery)
      ).docs[0].data() as Reward;

      // Step 9: Process the blockchain transaction to claim the reward
      // This triggers the wallet signature request and blockchain interaction
      const claimIsProcessed = await processRewardClaimByParticipant(address, {
        _participantWalletAddress: address as Address,
        _smartContractAddress: fetchedSurvey.contractAddress as Address,
        _rewardId: reward.id,
        _nonce: BigInt(reward.nonce as string),
        _signature: reward.signature as string,
        _chainId: chainId,
      });

      // Step 10: Handle the blockchain transaction result
      if (claimIsProcessed.success) {
        // Clear the previous toast notification
        toaster.dismiss(toasterIds.rewardRecordFound);

        // Step 11: Update the reward record in the database to reflect claimed status
        await updateDoc(rewardRef, {
          isClaimed: true,
          transactionHash: claimIsProcessed.transactionHash,
          amountIncUSD: survey?.rewardAmountIncUSD,
          timeUpdated: Timestamp.now(),
        });

        // Step 12: Notify user of successful claim
        toaster.create({
          id: toasterIds.rewardClaimedSuccessfully,
          description: "Reward claimed successfully!",
          duration: 6000,
          type: "success",
        });

        // Brief delay to allow user to see success message before redirect
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Step 13: Track the successful claim event for analytics
        trackAmplitudeEvent("Reward claimed", {
          participantWalletAddress: participant?.walletAddress,
          participantId: participant?.id,
          surveyId: survey?.id,
        });

        // Step 14: Redirect user to success page
        window.location.replace(`/survey/${surveyId}/transaction-successful`);
      } else {
        // Handle case where blockchain transaction failed
        toaster.dismiss(toasterIds.rewardRecordFound);
        toaster.create({
          description:
            'Reward claim was unsuccessful. Contact support via "More".',
          duration: 6000,
          type: "error",
        });

        // Track the failed claim event for analytics
        trackAmplitudeEvent("Reward claim failed", {
          participantWalletAddress: participant?.walletAddress,
          participantId: participant?.id,
          surveyId: survey?.id,
        });
      }
    } catch (error) {
      // Handle unexpected errors during claim process
      toaster.dismiss(toasterIds.rewardRecordFound);
      toaster.create({
        description:
          'An unexpected error occurred. Contact support via "More".',
        duration: 6000,
        type: "error",
      });
    }

    // Reset processing state regardless of outcome
    setIsProcessingRewardClaim(false);
  };
  if (!isMounted)
    return (
      <Flex justify="center" align="center" minH="100%">
        <Spinner size="xl" color="#363062" />
      </Flex>
    );

  return (
    <Flex flexDirection={"column"} w={"100%"} bgColor={"#ECECEC"} h={"100%"}>
      <Toaster />

      <Box
        bgColor="white"
        h="25"
        borderRadius={10}
        flexDirection={"column"}
        pb={2}
        mb={4}
        alignSelf={"center"}
        w={"4/6"}
        mt={10}
        mx={2}
        justifyContent={"center"}
      >
        <Box bgColor="white" h="30" borderRadius={15}>
          <Flex flexDirection="column" alignItems="center">
            <Box
              width="100%"
              height={"35%"}
              bgColor={"#94B9FF"}
              overflow="hidden"
              borderRadius={10}
            >
              <Image
                src="/success.png" // Replace with your image URL
                alt="Background"
                width="100%"
                height="35vh"
                objectFit={"contain"}
                blur={"md"}
              />
            </Box>
            <Text
              fontSize={"lg"}
              mb={2}
              color="#363062"
              alignSelf={"center"}
              mt={4}
            >
              You earned {formatTokenAmount(survey?.rewardAmountIncUSD)}{" "}
              {survey?.rewardToken === RewardToken.celoDollar ? "cUSD" : "G$"}
            </Text>

            <Text fontSize={"sm"} mb={2} color="black" textAlign={"center"}>
              Once claimed, this amount will be transferred to your Minipay
              wallet.
            </Text>
          </Flex>
        </Box>
      </Box>
      <Button
        bgColor={"#363062"}
        borderRadius={15}
        px={6}
        w={"3/6"}
        mt={5}
        alignSelf={"center"}
        mb={16}
        onClick={() => {
          trackAmplitudeEvent("Claim clicked", {
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
