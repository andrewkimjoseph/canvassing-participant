'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { VisuallyHidden, Flex } from '@chakra-ui/react';
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

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC" px={4}>
      <VisuallyHidden>
        <MoreOptionsCard
          SVGIcon={MoreOptionsProfileIconC}
          primaryText={'View Profile'}
          secondaryText={'Manage your account details'}
          link={'#'}
          onClick={() =>
            trackAmplitudeEvent('View profile clicked', {
              participantWalletAddress: participant?.walletAddress,
              participantId: participant?.id,
            })
          }
        />
      </VisuallyHidden>

      <MoreOptionsCard
        SVGIcon={SupportIconC}
        primaryText={'Support'}
        secondaryText={'Get help with your queries'}
        link={`https://tally.so/r/wbNq90?miniPayWalletAddress=${participant?.walletAddress}`}
        onClick={() =>
          trackAmplitudeEvent('Support clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
          })
        }
      />

      <MoreOptionsCard
        SVGIcon={AboutIconC}
        primaryText={'About'}
        secondaryText={'Learn more about us'}
        link={'https://thecanvassing.xyz'}
        onClick={() =>
          trackAmplitudeEvent('About clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
          })
        }
      />

      <MoreOptionsCard
        SVGIcon={TermsIconC}
        primaryText={'Terms and Conditions'}
        secondaryText={'Read our terms and conditions'}
        link={
          'https://canvassing.notion.site/Terms-of-Service-1285e1ccc593808f8d1df0b444c36b85?pvs=4'
        }
        onClick={() =>
          trackAmplitudeEvent('Terms clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
          })
        }
      />

      <MoreOptionsCard
        SVGIcon={PrivacyIconC}
        primaryText={'Privacy Policy'}
        secondaryText={'Read through our privacy policies'}
        link={
          'https://canvassing.notion.site/Privacy-Policy-9446d085f6f3473087868007d931247c'
        }
        onClick={() =>
          trackAmplitudeEvent('Privacy clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
          })
        }
      />

      <MoreOptionsCard
        SVGIcon={FAQsIconC}
        primaryText={'FAQs'}
        secondaryText={'Check out our Frequently Asked Questions'}
        link={'/more/faqs'}
        onClick={() =>
          trackAmplitudeEvent('FAQs clicked', {
            participantWalletAddress: participant?.walletAddress,
            participantId: participant?.id,
          })
        }
      />
    </Flex>
  );
}
