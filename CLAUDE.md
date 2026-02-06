# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
yarn dev      # Run development server (http://localhost:3000)
yarn build    # Production build
yarn start    # Start production server
```

## Architecture Overview

This is a Next.js 14 App Router application for live stream tipping using Yellow Network state channels.

### Core Stack
- **Next.js 14** with App Router (almost all components are client-side via `'use client'`)
- **wagmi + RainbowKit** for wallet connection (supports mainnet, Optimism, Arbitrum, Base, Polygon)
- **viem** for Ethereum client operations
- **@erc7824/nitrolite** for state channel operations via Yellow Network
- **WebRTC** for P2P live video/audio streaming (host → viewers)
- **Supabase** for database (JSONB document store), authentication, storage, and Realtime (signaling + chat)
- **TailwindCSS** with custom dark theme
- **swagger-ui-react** for API documentation at `/api-docs`

### Conventions
- Path alias: `@/*` maps to the project root (configured in `tsconfig.json`)
- Wallet addresses are always normalized to lowercase before DB queries
- Nitrolite hooks use `// @ts-nocheck` due to SDK typing gaps — be aware when modifying `/lib/nitrolite/`
- IDs: wallet address for users, `crypto.randomUUID()` for streams and tips

### Key Directories
- `/app` - Next.js pages (landing, browse, host, stream, api-docs) and providers. Root (`/`) redirects to `/landing`
- `/app/api` - API routes (health, users, streams, streams/[id]/end, tips)
- `/components` - UI components (LiveStream, VideoPlayer, ChatPanel, ViewerSidePanel, TipPanel, TipPanelV2) and `/ui` subdir for reusable primitives
- `/components/host` - Host dashboard components (ProfileSetupForm, StreamControlPanel, HostDashboard, HostVideoPreview, StreamStatusPanel, TipsDashboard, TipFeed)
- `/hooks` - React hooks for data fetching (`useStreamerInfo`, `useBalanceOf`, `useUserProfile`, `useHostStream`, `useStreamTips`, `useLiveStreams`), WebRTC (`useMediaStream`, `useWebRTCHost`, `useWebRTCViewer`), and chat (`useStreamChat`)
- `/lib/nitrolite` - State channel integration (types, config, useNitrolite for viewer, useHostNitrolite for host)
- `/lib/supabase` - Supabase client configuration (browser client, server client, middleware)
- `/lib/swagger` - OpenAPI spec (`openapi.json`)

### Database (Supabase JSONB Document Store)
Single `documents` table with JSONB `data` column, acting as a NoSQL-style document store:

| Collection | `id`           | `data` fields                                                                                      |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `users`    | wallet_address | `display_name`, `avatar_url`                                                                       |
| `streams`  | uuid           | `streamer_wallet`, `title`, `status` (live/ended), `started_at`, `ended_at`                        |
| `tips`     | uuid           | `stream_id`, `from_address`, `to_address`, `token`, `amount`, `memo`, `tx_type`, `clearnode_tx_id` |

Query patterns: `eq('collection', 'users')`, `eq('data->>field', value)`, GIN index on `data`.

### API Routes
- `GET/POST /api/users` - User profile CRUD (query by wallet)
- `GET/POST /api/streams` - Stream lookup by id (with streamer info) or by wallet (current live stream); create new stream
- `POST /api/streams/[id]/end` - End a live stream (verifies ownership)
- `GET/POST /api/tips` - Tips for a stream (with aggregated totals); record a tip
- `GET /api/health` - Supabase connectivity check
- `/api-docs` - Swagger UI (OpenAPI documentation)

### State Management Pattern
- **Wallet state**: wagmi hooks (`useAccount`, `useWalletClient`, `usePublicClient`)
- **Server state**: React Query for async data (`useStreamInfo`, `useBalanceOf`, `useUserProfile`, `useHostStream`, `useStreamTips`)
- **Nitrolite state**: `useNitrolite` (viewer) and `useHostNitrolite` (host) hooks manage WebSocket connection and auth flow

The `useNitrolite` hook (`/lib/nitrolite/useNitrolite.ts`) handles viewer-side:
- WebSocket connection to ClearNode
- Auth challenge/verification flow (EIP-712 signing)
- Session key management
- Tip submission

The `useHostNitrolite` hook (`/lib/nitrolite/useHostNitrolite.ts`) handles host-side:
- WebSocket connection to ClearNode
- Auth challenge/verification flow (uses SDK `parseAnyRPCResponse`)
- Listens for `TransferNotification` ("tr") messages for incoming tips
- Maintains `tips: RPCTransaction[]` state
- `setOnTipReceived` callback for persisting tips to DB

Status state machine (both hooks): `idle → ws_connecting → ws_connected → auth_requested → auth_challenged → auth_verified`

### WebRTC P2P Streaming
- **Architecture**: Host captures webcam/mic via `getUserMedia`, creates `RTCPeerConnection` per viewer
- **Signaling**: Supabase Realtime broadcast channel `stream-signal:{streamId}` (no extra server)
- **STUN**: Google's free STUN servers (`stun.l.google.com`)
- **Scalability**: ~5-10 concurrent viewers (MVP)

**Signaling protocol** (all via Supabase Realtime broadcast):

| Event | Direction | Payload |
|---|---|---|
| `viewer-join` | Viewer → Host | `{ viewerId }` |
| `offer` | Host → Viewer | `{ viewerId, sdp }` |
| `answer` | Viewer → Host | `{ viewerId, sdp }` |
| `ice-candidate` | Both | `{ viewerId, candidate, sender }` |
| `stream-ended` | Host → All | `{}` |

**Key hooks**:
- `useMediaStream` — Webcam/mic capture via `getUserMedia`. Returns `stream`, `startCapture()`, `stopCapture()`, `videoRef`, `error`. Cleans up tracks on unmount.
- `useWebRTCHost` — Host-side. Maintains `Map<viewerId, RTCPeerConnection>`. Creates peer per viewer, manages SDP/ICE exchange, tracks `viewerCount`, broadcasts `stream-ended` on cleanup.
- `useWebRTCViewer` — Viewer-side. Sends `viewer-join`, handles offer/answer/ICE. Auto-retries up to 3 times on disconnect. Handles autoplay policy: lets `autoPlay` attempt unmuted playback, falls back to muted + unmute button if browser blocks it.

**Autoplay policy handling**: The viewer uses `autoPlay` on the `<video>` element. If the browser blocks unmuted autoplay (e.g. direct URL visit without prior interaction), `ensurePlayback()` detects `video.paused` after 500ms and falls back to muted playback with an unmute button. From `/browse` navigation (user click), autoplay with sound works natively.

### Live Chat
- **Channel**: Supabase Realtime broadcast `stream-chat:{streamId}` with `{ self: true }`
- **Ephemeral**: No DB persistence, messages only exist in-memory (capped at 200)
- **Hook**: `useStreamChat(streamId, senderName, senderAddress)` → `messages[]`, `sendMessage()`, `isConnected`
- **UI**: `ViewerSidePanel` provides Chat/Tips tab toggle on the viewer page. `ChatPanel` renders messages with auto-scroll.

### Host Page (`/host`) State Machine
1. **Not connected** → Show ConnectButton prompt
2. **Connected, no profile** → `ProfileSetupForm`
3. **Connected, has profile, no live stream** → `StreamControlPanel`
4. **Connected, has profile, live stream** → `HostDashboard` (auto-starts camera, connects WebRTC + WebSocket, receives tips)

### Viewer Page (`/stream`) Layout
- Left column (7/12): `LiveStream` with `VideoPlayer` (WebRTC video), connection state overlay, unmute button
- Right column (5/12): `ViewerSidePanel` with Chat/Tips tab toggle

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
