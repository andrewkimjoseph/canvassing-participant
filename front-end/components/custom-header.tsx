'use client';

import {
  Box,
  Flex,
  Link,
  IconButton,
  Circle,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerActionTrigger,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  Text,
  DrawerTrigger,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Avatar } from '@/components/ui/avatar';
import { LogoC } from './logo';
import { HamburgerIconC } from './hamburger-icon';
import { DrawerLogoC } from './drawer-logo';
import { DrawerCardC } from './drawer-card';
import { HomeIconC } from './icons/home-icon';
import { RewardHistoryIconC } from './icons/reward-history-icon';
import { CloseIconC } from './icons/close-icon';
import useParticipantStore from '@/stores/useParticipantStore';
import { useState, useEffect } from 'react';
import { injected } from 'wagmi/connectors';
import { useAccount, useConnect } from 'wagmi';

const CustomHeader = () => {
  const { participant } = useParticipantStore();
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      window.ethereum &&
      (window.ethereum.isMiniPay || window.ethereum.isMinipay)
    ) {
      setIsMiniPay(true);
      connect({ connector: injected({ target: 'metaMask' }) });
    }
  }, [connect]);

  return (
    <DrawerRoot size={'full'} placement={'start'}>
      <DrawerBackdrop />
      <Box bg="#363062" px={4} position="sticky" top="0" left="0" zIndex="1000">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <DrawerTrigger asChild>
            <IconButton size={'md'} aria-label={'Open Menu'}>
              <HamburgerIconC />
            </IconButton>
          </DrawerTrigger>

          <Link href="/">
            <LogoC />
          </Link>

          {mounted ? (
            <Circle size="10px" bgColor={isConnected ? 'green.500' : 'red.500'} />
          ) : (
            <Box w="10px" h="10px" /> // Placeholder with same dimensions
          )}
        </Flex>
      </Box>

      <DrawerContent w={'60vw'} bgColor={'#363062'}>
        <DrawerHeader>
          <Flex
            flexDirection={'row'}
            alignItems={'start'}
            justify={'space-between'}
            pt={3}
          >
            <DrawerLogoC />
            <DrawerActionTrigger>
              <CloseIconC />
            </DrawerActionTrigger>
          </Flex>
        </DrawerHeader>
        <DrawerBody>
          <Flex flexDirection={'column'} alignItems={'start'}>
            <DrawerActionTrigger>
              <DrawerCardC SVGIcon={HomeIconC} text={'Home'} link={'/'} />
            </DrawerActionTrigger>
            <DrawerActionTrigger>
              <DrawerCardC
                SVGIcon={RewardHistoryIconC}
                text={'Reward History'}
                link={'/reward-history'}
              />
            </DrawerActionTrigger>
          </Flex>
        </DrawerBody>
        <DrawerFooter flexDirection={'column'} alignItems={'center'} pb={16}>
          {!isMiniPay ? (
            <ConnectButton
              chainStatus="none"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'avatar',
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
              label="Connect Wallet"
            />
          ) : null}
          <Box className="flex flex-row items-left w-full mt-8 mb-8">
            <Avatar variant={'solid'} size="lg" bgColor={'white'} />

            <Box className="flex flex-col items-left relative ml-4">
              <Text fontSize={18} mb={2} color={'white'}>
                {participant?.username || 'Userxxxx'}
              </Text>
              <Text fontSize={14} mb={2} color={'white'}>
                Participant
              </Text>
            </Box>
          </Box>
        </DrawerFooter>
        <DrawerCloseTrigger />
      </DrawerContent>
    </DrawerRoot>
  );
};

export default CustomHeader;