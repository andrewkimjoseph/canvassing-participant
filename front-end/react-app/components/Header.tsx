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
  DrawerTitle,
  DrawerTrigger,
  Button,
  DrawerActionTrigger,
} from '@chakra-ui/react';

import { LogoC } from './LogoC';
import { HamburgerIconC } from './HamburgerIconC';
import { useState } from 'react';
import { DrawerLogoC } from './DrawerLogoC';

export default function Header() {
  return (
    <>
      <DrawerRoot size={'full'} placement={'start'}>
        <DrawerBackdrop />

        <DrawerTrigger asChild>
          <Box
            bg="#1E1E49"
            px={4}
            position="sticky"
            top="0"
            zIndex="1000"
            // borderBottomLeftRadius={20}
          >
            <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
              <IconButton size={'md'} aria-label={'Open Menu'}>
                <HamburgerIconC />
              </IconButton>
              <Link href="/">
                <LogoC />
              </Link>
              <Circle
                size="10px"
                bg={`${true ? 'green' : '#E6E8FA'}`}
                color="white"
              ></Circle>
            </Flex>
          </Box>
        </DrawerTrigger>
        <DrawerContent w={'60vw'} bgColor={'#1E1E49'}>
          <DrawerHeader>
            {/* <DrawerTitle>Drawer Title</DrawerTitle> */}

            <DrawerLogoC />
          </DrawerHeader>
          <DrawerBody></DrawerBody>
          <DrawerFooter>
            <DrawerActionTrigger>
              <Button variant="outline">Cancel</Button>
            </DrawerActionTrigger>
            <Button>Save</Button>
          </DrawerFooter>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}
