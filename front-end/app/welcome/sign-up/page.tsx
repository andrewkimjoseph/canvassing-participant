'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  Box,
  Image,
  VStack,
  Text,
  Flex,
  createListCollection,
} from '@chakra-ui/react';

import { Button } from '@/components/ui/button';

import { Toaster, toaster } from '@/components/ui/toaster';

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '@/components/ui/select';

import { SignUpPageIconC } from '@/components/icons/signup-page-icon';
import useParticipantStore from '@/stores/useParticipantStore';
import { Timestamp } from 'firebase/firestore';
import { SpinnerIconC } from '@/components/icons/spinner-icon';

export default function SignUpPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { address } = useAccount();
  const { setParticipant } = useParticipantStore();
  const [country, setCountry] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async () => {
    setIsCreatingParticipant(true);

    if (!gender || !country || !address) {
      toaster.create({
        description: 'Please select all required fields',
        duration: 3000,
        type: 'info',
      });

      setIsCreatingParticipant(false);

      return;
    }

    try {
      await setParticipant({
        gender,
        country,
        walletAddress: address,
        username: `user_${address.slice(2, 7)}`,
        timeCreated: Timestamp.now(),
        timeUpdated: Timestamp.now(),
        isAdmin: false,
        emailAddress: null
      });

      toaster.create({
        description: 'Account created successfully!',
        duration: 3000,
        type: 'success',
      });

      // Wait for 1 second to show the success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsCreatingParticipant(false);

      // Wait a bit more before navigation to ensure the user sees the success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push('/');
    } catch (error) {
      toaster.create({
        description: 'Failed to create account. Please try again.',
        duration: 3000,
        type: 'warning',
      });
      setIsCreatingParticipant(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <VStack width="100vw" h={'100vh'}>
      <Toaster />

      <Box position="relative" width="100%" height="50%" overflow="hidden">
        <Image
          src="/signup-page.jpg"
          alt="Background"
          width="100vw"
          objectFit="cover"
          blur={'md'}
        />
      </Box>

      <Flex
        flex={'1'}
        flexDirection={'column'}
        justify={'start'}
        alignItems={'center'}
        position="relative"
        overflow="hidden"
        margin={-40}
        bgColor={'#E2E9F7'}
        w={'100vw'}
        h={'100%'}
        borderTopLeftRadius={70}
        borderTopRightRadius={70}
      >
        <Box pt={4}>
          <SignUpPageIconC />
        </Box>

        <Text fontSize="3xl" fontWeight="bold" color="#363062" py={5}>
          Get Started
        </Text>

        <Box w={'4/6'}>
          <SelectRoot
            collection={genders}
            bgColor={'white'}
            borderRadius={10}
            onValueChange={(selectedGender) => {
              const gender: string = selectedGender.items[0].value;

              setGender(gender);
            }}
          >
            <SelectTrigger>
              <SelectValueText
                placeholder="Select Gender"
                color={'black'}
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

        <Box w={'4/6'} pt={6}>
          <SelectRoot
            collection={countries}
            bgColor={'white'}
            borderRadius={10}
            onValueChange={(selectedCountry) => {
              const country: string = selectedCountry.items[0].value;

              setCountry(country);
            }}
          >
            <SelectTrigger>
              <SelectValueText
                placeholder="Select Country"
                color={'black'}
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
          bgColor={'#363062'}
          borderRadius={15}
          color={'white'}
          px={6}
          w={'3/6'}
          mt={20}
          onClick={handleSubmit}
          disabled={!gender || !country}
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
    { label: '♂️ Male', value: 'M' },
    { label: '♀️ Female', value: 'F' },
  ],
});

const countries = createListCollection({
  items: [
    { label: '🇳🇬 Nigeria', value: 'NIG' },
    { label: '🇰🇪 Kenya', value: 'KEN' },
    // { label: '🇺🇬 Uganda', value: 'UGN' },
  ],
});
