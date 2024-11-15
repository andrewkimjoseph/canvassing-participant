'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Box, Text, Flex, Spinner } from '@chakra-ui/react';
import useRewardStore from '@/stores/useRewardStore';
import { useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';

import {
  ClipboardButton,
  ClipboardIconButton,
  ClipboardInput,
  ClipboardRoot,
} from '@/components/ui/clipboard';

export default function RewardHistory() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { rewards } = useRewardStore();
  const router = useRouter();
  const { participant, checkParticipant } = useParticipantStore();

  const checkParticipantStatus = useCallback(() => {
    if (isConnected && address) {
      checkParticipant(address);
    }
  }, [isConnected, address, checkParticipant]);

  useEffect(() => {
    checkParticipantStatus();
  }, [checkParticipantStatus]);

  useEffect(() => {
    if (isMounted && !participant) {
      router.replace('/');
    }
  }, [isMounted, participant, router]);

  useEffect(() => {
    setIsMounted(true);
  }, [address, isConnected]);

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC" px={4}>
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="#363062"
        textAlign="left"
        py={3}
      >
        Reward History
      </Text>

      <Box h="100%" overflowY="auto">
        {rewards.length > 0 ? (
          rewards.map((reward) => (
            <Box
              key={reward.id}
              bgColor="white"
              h="auto"
              w="full"
              borderLeft="solid"
              borderColor="black"
              borderLeftWidth={4}
              borderTopRightRadius={10}
              borderBottomRightRadius={10}
              p={4}
              mb={4}
            >
              <Text fontSize="lg" color="#363062">
                {reward.timeCreated
                  ? new Date(reward.timeCreated.seconds * 1000).toLocaleString()
                  : null}
              </Text>

              <Flex justify="space-between" align="center" mt={2}>
                <Text fontSize="lg" color={reward.isClaimed ? 'green' : 'red'}>
                  {reward.isClaimed ? 'Claim Completed' : 'Pending Claim'}
                </Text>
                <Text fontSize="sm" color="black">
                  {reward.amountIncUSD
                    ? `cUSD ${reward.amountIncUSD.toFixed(2)}`
                    : 'N/A'}
                </Text>
              </Flex>
              <Flex justify="start" align="center" mt={2}>
                <Text fontSize="lg" color="#94B9FF">
                  {reward.id}
                </Text>
                <ClipboardRoot value={reward.id} color={'black'}>
                  <ClipboardIconButton />
                </ClipboardRoot>
              </Flex>
              <Flex justify="start" align="center" mt={4}>
                <Text
                  fontSize="sm"
                  color="black"
                  textDecoration={'underline'}
                  onClick={() => {
                    if (reward.isClaimed) {
                      router.push(
                        `https://celo-alfajores.blockscout.com/tx/${reward.transactionHash}`
                      );
                    } else {
                      router.push(
                        `/survey/${reward.surveyId}/success?submissionId=${reward.submissionId}&respondentId=${reward.respondentId}`
                      );
                    }
                  }}
                >
                  {reward.isClaimed ? 'View on block explorer' : 'Claim'}
                </Text>
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
              No rewards available
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
