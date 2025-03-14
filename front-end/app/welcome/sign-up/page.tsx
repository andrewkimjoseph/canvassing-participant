"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Box,
  Image,
  VStack,
  Text,
  Flex,
  createListCollection,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

import { Toaster, toaster } from "@/components/ui/toaster";

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

import { SignUpPageIconC } from "@/components/icons/signup-page-icon";
import useParticipantStore from "@/stores/useParticipantStore";
import { Timestamp } from "firebase/firestore";
import { SpinnerIconC } from "@/components/icons/spinner-icon";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/firebase";
import useAmplitudeContext from "@/hooks/useAmplitudeContext";

export default function SignUpPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { setParticipant } = useParticipantStore();
  const [country, setCountry] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const { trackAmplitudeEvent } = useAmplitudeContext();
  const { participant, getParticipant } = useParticipantStore();
  const { address, isConnected } = useAccount();
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);

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
      router.replace("/");
    }
  }, [isMounted, participant, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async () => {
    trackAmplitudeEvent("Create account clicked", {
      walletAddress: address,
    });

    setIsCreatingParticipant(true);

    if (!gender || !country || !address) {
      toaster.create({
        description: "Please select all required fields",
        duration: 3000,
        type: "info",
      });
      trackAmplitudeEvent("Create account slowed down", {
        walletAddress: address,
      });
      setIsCreatingParticipant(false);
      return;
    }

    try {
      if (auth.currentUser) {
        toaster.create({
          description: "Failed. Cannot create another user from the same context.",
          duration: 3000,
          type: "warning",
        });
        setIsCreatingParticipant(false);
        trackAmplitudeEvent("Create account failed", {
          walletAddress: address,
        });
        return;
      }

      const anonUserCredentials = await signInAnonymously(auth);

      const authId = anonUserCredentials.user.uid;

      await setParticipant(
        {
          authId,
          gender,
          country,
          walletAddress: address,
          username: `user_${address.slice(2, 7)}`,
          timeCreated: Timestamp.now(),
          timeUpdated: Timestamp.now(),
          isAdmin: false,
          emailAddress: null,
        },
        authId
      );

      trackAmplitudeEvent("Account created", {
        walletAddress: address,
        authId,
        gender,
        country,
      });

      toaster.create({
        description: "Account created successfully!",
        duration: 3000,
        type: "success",
      });

      // Wait for 1 second to show the success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsCreatingParticipant(false);

      // Wait a bit more before navigation to ensure the user sees the success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.replace("/");
    } catch (error) {
      toaster.create({
        description: "Failed to create account. Please try again.",
        duration: 3000,
        type: "warning",
      });
      setIsCreatingParticipant(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <VStack width="100%" h={"100%"} bgColor={"#E2E9F7"}>
      <Toaster />

      <Box position="relative" width="100%" height="100%" overflow="hidden">
        <Image
          src="/signup-page.jpg"
          alt="Background"
          width="100%"
          objectFit="cover"
          blur={"md"}
        />
      </Box>

      <Flex
        flex={"1"}
        flexDirection={"column"}
        justify={"start"}
        alignItems={"center"}
        position="absolute"
        top="40%" // Changed from 50% to 45% to move it higher
        left="0"
        overflow="hidden"
        padding={0}
        paddingBottom={10}
        bgColor={"#E2E9F7"}
        w={"100%"}
        h={"60%"} // Increased from 50% to 55% to maintain coverage
        borderTopLeftRadius={70}
        borderTopRightRadius={70}
        zIndex={10} // Ensure it appears above the image
      >
        <Box pt={4}>
          <SignUpPageIconC />
        </Box>

        <Text fontSize="3xl" fontWeight="bold" color="#363062" py={5}>
          Get Started
        </Text>

        <Box w={"4/6"}>
          <SelectRoot
            collection={genders}
            bgColor={"white"}
            borderRadius={10}
            onValueChange={(selectedGender) => {
              const gender: string = selectedGender.items[0].value;

              setGender(gender);
            }}
          >
            <SelectTrigger>
              <SelectValueText
                placeholder="Select Gender"
                color={"black"}
                ml={3}
              />
            </SelectTrigger>
            <SelectContent>
              {genders.items.map((gender) => (
                <SelectItem item={gender} key={gender.value}>
                  {gender.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Box>

        <Box w={"4/6"} pt={6}>
          <SelectRoot
            collection={countries}
            bgColor={"white"}
            borderRadius={10}
            onValueChange={(selectedCountry) => {
              const country: string = selectedCountry.items[0].value;

              setCountry(country);
            }}
          >
            <SelectTrigger>
              <SelectValueText
                placeholder="Select Country"
                color={"black"}
                ml={3}
              />
            </SelectTrigger>
            <SelectContent>
              {countries.items.map((country) => (
                <SelectItem item={country} key={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Box>

        <Button
          bgColor={"#363062"}
          borderRadius={15}
          color={"white"}
          px={6}
          w={"3/6"}
          mt={10} // Reduced from 20 to give more breathing room
          mb={6} // Add margin bottom for spacing
          onClick={handleSubmit}
          disabled={!gender || !country || !address || isCreatingParticipant}
          loading={isCreatingParticipant}
          loadingText={<SpinnerIconC />}
        >
          <Text fontSize="16" fontWeight="bold" color="white">
            Create account
          </Text>
        </Button>
      </Flex>
    </VStack>
  );
}

const genders = createListCollection({
  items: [
    { label: "♂️ Male", value: "M" },
    { label: "♀️ Female", value: "F" },
  ],
});

const countries = createListCollection({
  items: [
    { label: "🇳🇬 Nigeria", value: "NIG" },
    { label: "🇰🇪 Kenya", value: "KEN" },
    { label: "🇬🇭 Ghana", value: "GHN" },
    { label: "🇺🇬 Uganda", value: "UGN" },
    { label: "🇿🇦 South Africa", value: "RSA" },
    { label: "🇹🇿 Tanzania", value: "TZA" },
    { label: "🇲🇼 Malawi", value: "MWI" },
    { label: "🏳️ Other", value: "OTH" },
  ],
});
