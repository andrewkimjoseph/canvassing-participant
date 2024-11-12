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
  Separator,
} from '@chakra-ui/react';
import { EditIconC } from '@/components/icons/EditIconC';

import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from '@/components/ui/accordion';
export default function TransactionSuccessfulPage() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  const [value, setValue] = useState(['survey-instructions']);

  const firstItem = [
    {
      value: 'survey-instructions',
      title: 'Survey instructions',
      text: '✅Select your primary stablecoin.',
    },
  ];

  const secondItem = [
    {
      value: 'time-duration',
      title: 'Time Duration',
      text: 'Estimated Completion Time: 2–3 minutes',
    },
  ];

  const thirdItem = [
    { value: 'researcher', title: 'Researcher', text: 'MiniPay' },
  ];

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
    <Flex flexDirection={'column'} w={'100%'} h={'100%'} bgColor={'#ECECEC'}>
      <Box
        width="100%"
        height={'35%'}
        overflow="hidden"
        borderRadius={10}
        mt={16}
      >
        <Image
          src="transactionSuccessful.png" // Replace with your image URL
          alt="Background"
          width="100%"
          height="35vh"
          objectFit={'contain'}
          blur={'md'}
        />
      </Box>
      <Text fontSize={'x-large'} mb={2} color="#363062" fontWeight="bold" alignSelf={'center'} mt={4}>
        Your transaction was successful!
      </Text>

      <Button
        bgColor={'#363062'}
        borderRadius={15}
        px={6}
        w={'3/6'}
        mt={5}
        alignSelf={'center'}
        mb={16}
      >
        <Text fontSize="16" fontWeight="bold" color="white">
          Back to Homepage
        </Text>
      </Button>
    </Flex>
  );
}
