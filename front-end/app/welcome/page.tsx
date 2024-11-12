'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import {
  Box,
  Image,
  Button,
  VStack,
  Text,
} from '@chakra-ui/react';
import { WelcomePageIconC } from '../../components/icons/welcome-page-icon';

export default function WelcomePage() {
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
    <VStack  width="100vw">
      {/* Background Image */}
      <Box position="relative" width="100%" height="50%" overflow="hidden" borderBottomLeftRadius={30} borderBottomRightRadius={30}>
        <Image 
          src="welcomePage.jpg" // Replace with your image URL
          alt="Background"
          width="100vw"
          height="60vh"
          objectFit="cover"
          blur={"md"}
        />

        {/* Logo at the top center of the image */}
        <Box position="absolute" top="10%" width="100%" display="flex" justifyContent="center">
          <WelcomePageIconC /> {/* Adjust the logo scale if needed */}
        </Box>
      </Box>

      {/* Text and Button below the image */}
      <Text fontSize="3xl" fontWeight="bold" color={"#363062"}>
        Welcome to Canvassing
      </Text>
      <Button bgColor={"#363062"} borderRadius={15} px={6} w={"3/6"} mt={5}>
        <Text fontSize="16" fontWeight="bold" color="white">
        Get Started
      </Text>
      </Button>
    </VStack>
  );
}
