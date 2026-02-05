# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
yarn dev      # Run development server (http://localhost:3000)
yarn build    # Production build
yarn start    # Start production server
yarn lint     # Run ESLint
```

## Architecture Overview

This is a Next.js 14 App Router application for live stream tipping using Yellow Network state channels.

### Core Stack
- **Next.js 14** with App Router (client components)
- **wagmi + RainbowKit** for wallet connection (supports mainnet, Optimism, Arbitrum, Base, Polygon)
- **viem** for Ethereum client operations
- **@erc7824/nitrolite** for state channel operations via Yellow Network
- **TailwindCSS** with custom dark theme

### Key Directories
- `/app` - Next.js pages (landing, browse, host, stream) and providers. Root (`/`) redirects to `/landing`
- `/components` - UI components (LiveStream, TipPanel, TipPanelV2) and `/ui` subdir for reusable primitives
- `/hooks` - React Query hooks (`useStreamerInfo`, `useBalanceOf`)
- `/lib/nitrolite` - State channel integration (types, config, useNitrolite hook)

### State Management Pattern
- **Wallet state**: wagmi hooks (`useAccount`, `useWalletClient`, `usePublicClient`)
- **Server state**: React Query for async data (`useStreamInfo`, `useBalanceOf`)
- **Nitrolite state**: `useNitrolite` hook manages WebSocket connection and auth flow

The `useNitrolite` hook (`/lib/nitrolite/useNitrolite.ts`) handles:
- WebSocket connection to ClearNode
- Auth challenge/verification flow (EIP-712 signing)
- Session key management
- Tip submission

Status state machine: `idle → ws_connecting → ws_connected → auth_requested → auth_challenged → auth_verified`

### Styling
Custom Tailwind theme in `tailwind.config.ts` with component classes in `globals.css`:
- `.panel`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`
- Dark theme colors: bg (#070A12), text (#E7E9EE), panel (rgba(9, 12, 22, 0.72))

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_PROJECT_ID          # WalletConnect project ID (required)
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL (required)
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anonymous key (required, used by browser client & middleware for auth)
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (required, server-side only, bypasses RLS)
```

Optional (for real channel settlement):
```
NEXT_PUBLIC_CLEARNODE_WS        # WebSocket URL for ClearNode
NEXT_PUBLIC_CHAIN_ID            # Chain ID (default: 1)
NEXT_PUBLIC_CUSTODY_CONTRACT    # State channel custody contract
NEXT_PUBLIC_ADJUDICATOR_CONTRACT # Adjudicator contract
```
