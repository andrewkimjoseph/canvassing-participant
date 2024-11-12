'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import { Box, Image, Button, VStack, Text, Flex, Link } from '@chakra-ui/react';
import { EditIconC } from '@/components/icons/edit-icon';

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
      h={'100vh'}
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
                Userxxxx
              </Text>
              {/* <EditIconC /> */}
            </Flex>
            <Text fontSize={14} mb={2} color="white">
              Surveys completed: 0
            </Text>
            {/* <Text fontSize={14} mb={2} color="white">
              Profile Completion: 80%
            </Text> */}
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

      <Box w={"full"}>
        {[1, 2, 3, 4, 5].map((donation) => (
          <Link key={donation + 1} href={"/survey"}>
            <Box
              key={donation}
              bgColor="white"
              h="25"
              w="full"
              borderRadius={10}
              flexDirection={'column'}
              pb={2}
              mb={4}
              mt={0}
              pt={1}
            >
              <Box bgColor="#CFCED8" h="30" borderRadius={10} mx={2}>
                <Flex
                  flexDirection="column"
                  alignItems="top"
                  pl={2}
                  pt={2}
                  mt={1}
                >
                  <Text fontSize={'lg'} mb={2} color="#363062">
                    Understanding Stablecoin Usage .....
                  </Text>

                  <Text fontSize={'sm'} mb={2} color="black">
                    Please share your experiences with stablecoins. Indicate how
                    you use them, what motivates you ...
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
                <Text fontSize={'lg'} color="green">
                  $015
                </Text>
                <Button bgColor={'#363062'} borderRadius={20} w={'1/6'} mr={1}>
                  <Text fontSize="8" color="white">
                    Start
                  </Text>
                </Button>
              </Flex>
            </Box>
          </Link>
        ))}
      </Box>
    </Flex>
  );
}
