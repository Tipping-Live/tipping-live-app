'use client';

import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from "viem";

export const config = getDefaultConfig({
  appName: 'EveryAid App',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "", // 你需要去 WalletConnect 建一個
  chains: [
    sepolia
  ],
  ssr: true,
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http()
  }
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          locale="en-US"
          theme={lightTheme({
            // match your light UI + logo palette
            accentColor: "#E1A2FA", // primary (coral)
            accentColorForeground: "#FFFFFF",
        
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
        
            // keep it airy + readable on light bg
          })}
          modalSize='compact'
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
