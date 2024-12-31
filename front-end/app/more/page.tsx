'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {Flex } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';

import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { MoreOptionsCard } from '@/components/more-options-card';
import { SupportIconC } from '@/components/icons/more-options-icons/support-icon';
import { AboutIconC } from '@/components/icons/more-options-icons/about-icon';
import { TermsIconC } from '@/components/icons/more-options-icons/terms-icon';
import { PrivacyIconC } from '@/components/icons/more-options-icons/privacy-icon';
import { FAQsIconC } from '@/components/icons/more-options-icons/faqs-icons';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';
import { ProfileIconC } from '@/components/icons/profile-icon';


export default function More() {
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

  const handleOptionClick = (eventName: string) => {
    trackAmplitudeEvent(eventName, {
      participantWalletAddress: participant?.walletAddress,
      participantId: participant?.id,
    });
  };

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  const moreOptions = getMoreOptions(participant?.walletAddress);

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC" px={4}>
      {moreOptions.map((option, index) => (
        <MoreOptionsCard
          key={index}
          SVGIcon={option.SVGIcon}
          primaryText={option.primaryText}
          secondaryText={option.secondaryText}
          link={option.link}
          onClick={() => handleOptionClick(option.eventName)}
        />
      ))}
    </Flex>
  );
}

const getMoreOptions = (walletAddress?: string) => [
  {
    SVGIcon: ProfileIconC,
    primaryText: 'View Profile',
    secondaryText: 'Manage your account details',
    link: `/more/profile`,
    eventName: 'Profile clicked',
  },
  {
    SVGIcon: SupportIconC,
    primaryText: 'Support',
    secondaryText: 'Get help with your queries',
    link: `https://tally.so/r/wbNq90?miniPayWalletAddress=${walletAddress}`,
    eventName: 'Support clicked',
  },
  {
    SVGIcon: AboutIconC,
    primaryText: 'About',
    secondaryText: 'Learn more about us',
    link: 'https://thecanvassing.xyz',
    eventName: 'About clicked',
  },
  {
    SVGIcon: TermsIconC,
    primaryText: 'Terms and Conditions',
    secondaryText: 'Read our terms and conditions',
    link: 'https://canvassing.notion.site/Terms-of-Service-1285e1ccc593808f8d1df0b444c36b85?pvs=4',
    eventName: 'Terms clicked',
  },
  {
    SVGIcon: PrivacyIconC,
    primaryText: 'Privacy Policy',
    secondaryText: 'Read through our privacy policies',
    link: 'https://canvassing.notion.site/Privacy-Policy-9446d085f6f3473087868007d931247c',
    eventName: 'Privacy clicked',
  },
  {
    SVGIcon: FAQsIconC,
    primaryText: 'FAQs',
    secondaryText: 'Check out our Frequently Asked Questions',
    link: '/more/faqs',
    eventName: 'FAQs clicked',
  },
];
