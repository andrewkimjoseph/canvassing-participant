'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Box, Flex, HStack, Link, IconButton, Circle } from '@chakra-ui/react';

import { LogoC } from './LogoC';
import { HamburgerIconC } from './HamburgerIconC';

export default function Header() {
  return (
    <>
      <Box bg="#1E1E49" px={4} position="sticky" top="0" zIndex="1000">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            color={'#1E1E49'}
            size={'md'}
            aria-label={'Open Menu'}
          >
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
    </>
  );
}
