'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import { Box, Image, Button, VStack, Text, Flex } from '@chakra-ui/react';
import { EditIconC } from '@/components/icons/EditIconC';

import { Avatar } from '@/components/ui/avatar';
export default function Home() {
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
      bgColor={'white'}
      pl={4}
    >
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
            <Avatar variant="solid" size="lg" bgColor="white" color={"black"}/>
          </Box>

          <Box ml={4}>
            <Flex alignItems="center" mb={2}>
              <Text fontSize={18} color="white" mr={2}>
                Userxxxx
              </Text>
              <EditIconC />
            </Flex>
            <Text fontSize={14} mb={2} color="white">
              Surveys completed: 0
            </Text>
            <Text fontSize={14} mb={2} color="white">
              Profile Completion: 80%
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

      
    </Flex>
  );
}
