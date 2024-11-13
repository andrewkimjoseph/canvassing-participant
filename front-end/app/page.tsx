'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Box, Button, VStack, Text, Flex, Link, Spinner } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import useParticipantStore from '@/stores/useParticipantStore';
import useSurveyStore from '@/stores/useSurveyStore';

export default function Home() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { participant, loading: participantLoading, checkParticipant } = useParticipantStore();
  const { surveys, fetchSurveys, loading: surveyLoading } = useSurveyStore();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (address && !participant) {
        await checkParticipant(address);
        if (!participant) {
          router.push('/welcome');
        }
      }
    };

    checkAndRedirect();
  }, [participant, address, checkParticipant, router]);

  useEffect(() => {
    if (isMounted && !surveys.length) {
      fetchSurveys();
    }
  }, [isMounted, surveys, fetchSurveys]);

  return (
    <Flex flexDirection={'column'} w={'100%'} bgColor={'#ECECEC'} px={4}>
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
              Surveys completed: 0
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

      <Box w="full" h="100vh">
        {surveyLoading ? (
          <Flex justify="center" align="center" h="100%">
            <Spinner size="lg" color="#363062" />
          </Flex>
        ) : surveys.length > 0 ? (
          surveys.map((survey) => (
            <Link key={survey.id} href={`survey/${survey.id}`}>
              <Box
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
                      {survey.smartContractAddress}
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
                  <Text fontSize={'lg'} color="green">
                    ${survey.rewardAmountIncUSD}
                  </Text>
                  <Button bgColor={'#363062'} borderRadius={20} w={'1/6'} mr={1}>
                    <Text fontSize="8" color="white">
                      Start
                    </Text>
                  </Button>
                </Flex>
              </Box>
            </Link>
          ))
        ) : (
          <Box
            bgColor="gray.100"
            h="25"
            w="full"
            borderRadius={10}
            flexDirection="column"
            pb={2}
            mb={4}
            mt={0}
            pt={2}
            pl={3}
            border="solid"
            borderColor="gray.300"
            borderWidth={1}
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
