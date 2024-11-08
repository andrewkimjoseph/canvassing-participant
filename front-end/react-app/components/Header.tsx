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
  DrawerTrigger,
  Text,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Avatar } from '@/components/ui/avatar';

import { LogoC } from './LogoC';
import { HamburgerIconC } from './HamburgerIconC';
import { DrawerLogoC } from './DrawerLogoC';
import { DrawerCardC } from './DrawerCardC';
import { HomeIconC } from './icons/HomeIconC';
import { RewardHistoryIconC } from './icons/RewardHistoryIconC';
import { ProfileIconC } from './icons/ProfileIconC';
import { CloseIconC } from './icons/CloseIconC';
import { EditIconC } from './icons/EditIconC';

export default function Header() {
  return (
    <>
      <DrawerRoot size={'full'} placement={'start'}>
        <Box bg="#363062" px={4} position="sticky" top="0" zIndex="1000">
          <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
            <DrawerTrigger asChild>
              <IconButton size={'md'} aria-label={'Open Menu'}>
                <HamburgerIconC />
              </IconButton>
            </DrawerTrigger>

            <Link href="/">
              <LogoC />
            </Link>
            <Circle
              size="10px"
              bg={`${true ? 'green' : 'red'}`}
              color="white"
            ></Circle>
          </Flex>
        </Box>

        <DrawerBackdrop />

        <DrawerContent w={'60vw'} bgColor={'#363062'} borderTopRightRadius={20}>
          <DrawerHeader>
            <Flex
              flexDirection={'row'}
              alignItems={'start'}
              justify={'space-between'}
              pt={8}
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
                  link={'/'}
                />{' '}
              </DrawerActionTrigger>
              <DrawerActionTrigger>
                <DrawerCardC
                  SVGIcon={ProfileIconC}
                  text={'Profile'}
                  link={'/'}
                />
              </DrawerActionTrigger>
            </Flex>
          </DrawerBody>
          <DrawerFooter flexDirection={'column'} alignItems={'center'} pb={16}>
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

            <Box className="flex flex-row items-left w-full mt-8 mb-8">
              <Avatar variant={'solid'} size="lg" />

              <Box className="flex flex-col items-left relative ml-4">
                <Text fontSize={18} mb={2}>
                  Userxxxx
                </Text>
                <Text fontSize={14} mb={2}>
                  Participant
                </Text>
              </Box>

              <Box className="flex flex-col items-left relative ml-4">
                <EditIconC />
              </Box>
            </Box>
          </DrawerFooter>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}
