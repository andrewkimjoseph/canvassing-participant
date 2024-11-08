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
} from '@chakra-ui/react';

import { LogoC } from './LogoC';
import { HamburgerIconC } from './HamburgerIconC';
import { DrawerLogoC } from './DrawerLogoC';
import { DrawerCardC } from './DrawerCardC';
import { HomeIconC } from './icons/homeIcon';
import { RewardHistoryIconC } from './icons/rewardHistoryIcon';
import { ProfileIconC } from './icons/profileIcon';

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

        <DrawerContent w={'60vw'} bgColor={'#363062'}>
          <DrawerHeader>
            <DrawerLogoC />
          </DrawerHeader>
          <DrawerBody>
          <Flex h={16}flexDirection={"column"}>
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
              <DrawerCardC SVGIcon={ProfileIconC} text={'Profile'} link={'/'} />
            </DrawerActionTrigger>
          </Flex>
     
          </DrawerBody>
          <DrawerFooter></DrawerFooter>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}
