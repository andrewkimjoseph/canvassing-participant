'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';

import { SpinnerIconC } from '@/components/icons/spinner-icon';
import CustomAccordion from '@/components/custom-accordion';
import { faqs } from '@/utils/faqs/faqs';

export default function FAQs() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { participant, getParticipant } = useParticipantStore();

  const checkParticipantStatus = useCallback(() => {
    if (isConnected && address) {
      getParticipant(address,  participant?.authId!);
    }
  }, [isConnected, address, getParticipant]);

  useEffect(() => {
    checkParticipantStatus();
  }, [checkParticipantStatus]);

  useEffect(() => {
    if (isMounted && !participant) {
      router.replace('/');
    }
  }, [isMounted, participant, router]);

  useEffect(() => {
    setIsMounted(true);
  }, [address, isConnected]);

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC" px={4}>
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="#363062"
        textAlign="left"
        py={3}
      >
        Frequently Asked Questions
      </Text>

      {faqs.map((faq) => (
        <CustomAccordion key={faq.id} title={faq.title} content={faq.content} />
      ))}
    </Flex>
  );
}
