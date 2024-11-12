'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import { Box, Image, Button, VStack, Text, Flex } from '@chakra-ui/react';
import { EditIconC } from '@/components/icons/EditIconC';

import { Avatar } from '@/components/ui/avatar';
export default function RewardHistory() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
    }
  }, [address, isConnected]);

  if (!isMounted) {
    return null;
  }

  return (
    <Flex
      flexDirection={'column'}
      w={'100%'}
      h={'100%'}
      bgColor={'#ECECEC'}
      px={4}
    >
      <Flex justify="flex-start">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="#363062"
          textAlign="left"
          py={3}
        >
          Reward History
        </Text>
      </Flex>

      <Box h="100%" overflowY="auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((donation) => (
          <Box
            key={donation}
            bgColor="white"
            h="25"
            w="full"
            borderTopRightRadius={10}
            borderBottomRightRadius={10}
            flexDirection={'column'}
            pb={2}
            mb={4}
            mt={0}
            pt={2}
            pl={3}
            borderLeft={'solid'}
            borderColor={'black'}
            borderLeftWidth={4}
          >
            <Text fontSize={'lg'} mb={2} color="#363062">
              25-10-2024 23:20
            </Text>

       

            <Flex
              flexDirection="row"
              justifyContent={'space-between'}
              alignItems={'center'}
            >
              <Text fontSize={'sm'} mb={2} color="green">
                Transaction Completed
              </Text>

              <Text fontSize={'sm'} mb={2} color="black" mr={2}>
               cUSD 0.25
              </Text>
            </Flex>

            <Text fontSize={'lg'} color="black">
              MiniPay
            </Text>
          </Box>
        ))}
      </Box>
    </Flex>
  );
}
