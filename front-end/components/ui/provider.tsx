'use client';

import { ChakraProvider, defaultSystem, Theme } from '@chakra-ui/react';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider forcedTheme="light" {...props}>
        <Theme appearance="light"> props</Theme>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
