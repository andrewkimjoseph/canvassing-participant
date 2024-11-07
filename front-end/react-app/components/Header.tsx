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
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTrigger,
} from '@chakra-ui/react';

import { LogoC } from './LogoC';
import { HamburgerIconC } from './HamburgerIconC';
import { DrawerLogoC } from './DrawerLogoC';

export default function Header() {
  return (
    <>
      <DrawerRoot size={'full'} placement={'start'}>
        <Box bg="#1E1E49" px={4} position="sticky" top="0" zIndex="1000">
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

        <DrawerContent w={'60vw'} bgColor={'#1E1E49'}>
          <DrawerHeader>
            <DrawerLogoC />
          </DrawerHeader>
          <DrawerBody></DrawerBody>
          <DrawerFooter></DrawerFooter>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}
