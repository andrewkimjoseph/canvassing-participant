'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  connectorsForWallets,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';

import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';

import CustomLayout from '@/components/custom-layout';
import MobileOnlyProvider from '@/providers/mobile-only-provider';
import NigeriaKenyaProvider from '@/providers/nigeria-kenya-provider';
import MiniPayProvider from './minipay-provider';
import { RPCUrls } from '@/utils/rpcURLs/rpcUrls';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'Canvassing - Participant',
    projectId: String(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID),
  }
);

const config = createConfig({
  connectors,
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http(RPCUrls.celoMainnet()),
    [celoAlfajores.id]: http(RPCUrls.celoAlfajores()),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#9D99B4',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'rounded',
            overlayBlur: 'small',
          })}
        >
          <MiniPayProvider>
            <MobileOnlyProvider>
              {/* <NigeriaKenyaProvider> */}
                <CustomLayout>{children}</CustomLayout>
              {/* </NigeriaKenyaProvider> */}
            </MobileOnlyProvider>
          </MiniPayProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
