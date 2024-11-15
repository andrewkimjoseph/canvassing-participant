'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Box,
  Text,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import useRewardStore from '@/stores/useRewardStore';

export default function RewardHistory() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { rewards } = useRewardStore();

  useEffect(() => {
    setIsMounted(true);

  }, [address, isConnected]);

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner/>
      </Flex>
    );
  }

  return (
    <Flex
      flexDirection="column"
      w="100%"
      h="100vh"
      bgColor="#ECECEC"
      px={4}
    >
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
              p={4}
              mb={4}
            >
              <Text fontSize="lg" color="#363062">
                {reward.timeCreated ? new Date(reward.timeCreated.seconds * 1000).toLocaleString() : null}
              </Text>

              <Flex
                justify="space-between"
                align="center"
              >
                <Text
                  fontSize="sm"
                  color={reward.isClaimed ? 'green' : 'red'}
                >
                  {reward.isClaimed ? 'Claim Completed' : 'Pending Claim'}
                </Text>
                <Text
                  fontSize="sm"
                  color="black"
                >
                  {reward.amountIncUSD ? `cUSD ${reward.amountIncUSD.toFixed(2)}` : 'N/A'}
                </Text>
              </Flex>

              <Text fontSize="lg" color="black">
                {reward.id}
              </Text>
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