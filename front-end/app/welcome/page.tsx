'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Box, Image, VStack, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import useParticipantStore from '@/stores/useParticipantStore';
import { WelcomePageIconC } from '@/components/icons/welcome-page-icon';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { SpinnerIconC } from '@/components/icons/spinner-icon';

export default function WelcomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isGettingStarted, setIsGettingStarted] = useState(false);

  const { address, isConnected } = useAccount();
  const { participant, getParticipant } = useParticipantStore();
  const router = useRouter();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkParticipantStatus = useCallback(() => {
    if (isConnected && address) {
      getParticipant(address);
    }
  }, [isConnected, address, getParticipant]);

  useEffect(() => {
    checkParticipantStatus();
  }, [checkParticipantStatus]);

  useEffect(() => {
    if (isMounted && participant) {
      router.replace('/');
    }
  }, [isMounted, participant, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetStarted = () => {
    setIsGettingStarted(true);
    trackAmplitudeEvent('Get started clicked', {
      walletAddress: address,
    });
    router.push('/welcome/sign-up');
    setIsGettingStarted(false);
  };

  return (
    <VStack width="100vw" h="100vh">
      <Box
        position="relative"
        width="100%"
        height="60vh"
        overflow="hidden"
        borderBottomLeftRadius={30}
        borderBottomRightRadius={30}
      >
        <Image
          src="welcomePage.jpg"
          alt="Background"
          width="100vw"
          height="60vh"
          objectFit="cover"
        />

        <Box
          position="absolute"
          top="10%"
          width="100%"
          display="flex"
          justifyContent="center"
        >
          <WelcomePageIconC />
        </Box>
      </Box>

      <Text fontSize="3xl" fontWeight="bold" color="#363062" pt="10">
        Welcome to
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color="#363062">
        Canvassing
      </Text>
      <Button
        bgColor="#363062"
        borderRadius={15}
        px={6}
        w="3/6"
        mt={5}
        loading={isGettingStarted}
        disabled={isGettingStarted}
        loadingText={<SpinnerIconC />}
        onClick={handleGetStarted}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Get Started
        </Text>
      </Button>
    </VStack>
  );
}
