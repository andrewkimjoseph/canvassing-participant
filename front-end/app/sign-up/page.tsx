'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import {
  Box,
  Image,
  Button,
  VStack,
  Text,
  Flex,
  createListCollection,
  Input,
  InputAddon,
  Group,
} from '@chakra-ui/react';

import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '@/components/ui/select';

import { WelcomePageIconC } from '../../components/icons/welcome-page-icon';
import { SignUpPageIconC } from '@/components/icons/signup-page-icon';
import { DateIconC } from '@/components/icons/date-icon';

export default function SignUpPage() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  const genders = createListCollection({
    items: [
      { label: '♂️ Male', value: 'M' },
      { label: '♀️ Female', value: 'F' },
    ],
  });

  const country = createListCollection({
    items: [
      { label: '🇳🇬 Nigeria', value: 'NIG' },
      { label: '🇰🇪 Kenya', value: 'KEN' },
      { label: '🇺🇬 Uganda', value: 'UGN' },
    ],
  });

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
    <VStack width="100vw" h={'100vh'}>
      <Box position="relative" width="100%" height="50%" overflow="hidden">
        <Image
          src="signup-page.jpg" // Replace with your image URL
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
          <SelectRoot collection={genders} bgColor={'white'} borderRadius={10}>
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
          <SelectRoot collection={country} bgColor={'white'} borderRadius={10}>
            <SelectTrigger>
              <SelectValueText
                placeholder="Select Country"
                color={'black'}
                ml={3}
              />
            </SelectTrigger>
            <SelectContent >
              {country.items.map((country) => (
                <SelectItem item={country} key={country.value}>
                  {country.label}
                
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Box>

        {/* <Box w={'4/6'}  pt={6}>
          <Group attached>
            <Input
              placeholder="Select Year of Birth"
              type="month"
              bgColor={'white'}
              color={'black'}
              borderRadius={10}
              _placeholder={{ color: "inherit" }}
              value={new Date().toISOString().slice(0, 7)}
            />
            <InputAddon bgColor={"white"} borderRadius={10}><DateIconC/></InputAddon>
          </Group>
        </Box> */}

        <Button bgColor={'#363062'} borderRadius={15} px={6} w={'3/6'} mt={20}>
          <Text fontSize="16" fontWeight="bold" color="white">
            Done
          </Text>
        </Button>
      </Flex>
    </VStack>
  );
}
