'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';

import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { MoreOptionsCard } from '@/components/more-options-card';
import { MoreOptionsProfileIconC } from '@/components/icons/more-options-icons/more-options-profile-icon';
import { SupportIconC } from '@/components/icons/more-options-icons/support-icon';
import { AboutIconC } from '@/components/icons/more-options-icons/about-icon';
import { TermsIconC } from '@/components/icons/more-options-icons/terms-icon';
import { PrivacyIconC } from '@/components/icons/more-options-icons/privacy-icon';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { FAQsIconC } from '@/components/icons/more-options-icons/faqs-icons';
import CustomAccordion from '@/components/custom-accordion';
import { faqs } from '@/utils/faqs/faqs';

export default function FAQs() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { participant, getParticipant } = useParticipantStore();
  const { trackAmplitudeEvent } = useAmplitudeContext();

  const checkParticipantStatus = useCallback(() => {
    if (isConnected && address) {
      getParticipant(address);
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
