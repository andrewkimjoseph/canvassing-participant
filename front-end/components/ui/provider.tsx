'use client';

import { ChakraProvider, defaultSystem, Theme } from '@chakra-ui/react';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';

interface ProviderProps extends ColorModeProviderProps {
  children: React.ReactNode;
}

export function Provider({ children, ...props }: ProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider forcedTheme="light">
        <Theme appearance="light">{children}</Theme>
      </ColorModeProvider>
    </ChakraProvider>
  );
}