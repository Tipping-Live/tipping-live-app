'use client';

import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { mainnet, optimism, arbitrum, base, polygon } from 'wagmi/chains';
import { http } from "viem";

export const config = getDefaultConfig({
  appName: 'Tipping Live App',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "", // 你需要去 WalletConnect 建一個
  chains: [
    mainnet,
    optimism,
    arbitrum,
    base,
    polygon
  ],
  ssr: true,
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http()
  }
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          locale="en-US"
          theme={darkTheme({
            accentColor: '#7C3AED',
            accentColorForeground: '#FFFFFF',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })} modalSize='compact'
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
