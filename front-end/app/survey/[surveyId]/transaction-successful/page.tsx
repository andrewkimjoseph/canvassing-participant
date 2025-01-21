'use client';

import { useEffect, useState } from 'react';

import { Box, Image, Button, Text, Flex } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';

export default function TransactionSuccessfulPage() {
  const [isMounted, setIsMounted] = useState(false);

  const params = useParams();
  const surveyId = params.surveyId;

  const { participant } = useParticipantStore();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Flex flexDirection={'column'} w={'100%'} h={'100vh'} bgColor={'#ECECEC'}>
      <Box
        width="100%"
        height={'35%'}
        overflow="hidden"
        borderRadius={10}
        mt={16}
      >
        <Image
          src="/transaction-successful.png" // Replace with your image URL
          alt="Background"
          width="100%"
          height="35vh"
          objectFit={'contain'}
          blur={'md'}
        />
      </Box>
      <Text
        fontSize={'x-large'}
        mb={2}
        color="#363062"
        fontWeight="bold"
        textAlign={'center'}
        mt={4}
      >
        Your claim was successful!
      </Text>

      <Button
        bgColor={'#363062'}
        borderRadius={15}
        px={6}
        w={'3/6'}
        mt={5}
        alignSelf={'center'}
        mb={16}
        onClick={() => {
          trackAmplitudeEvent('Go home clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
            surveyId: surveyId,
          });

          window.location.replace('/');
        }}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Back to Homepage
        </Text>
      </Button>
    </Flex>
  );
}
