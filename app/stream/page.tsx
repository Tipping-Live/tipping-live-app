'use client'

import { useMemo, Suspense } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import TipPanel from '@/components/TipPanelV2'
import LiveStream from '@/components/LiveStream'
import ChatPanel from '@/components/ChatPanel'
import ViewerSidePanel from '@/components/ViewerSidePanel'
import { useNitrolite } from '@/lib/nitrolite/useNitrolite'
import { useWebRTCViewer } from '@/hooks/useWebRTCViewer'
import { useStreamChat } from '@/hooks/useStreamChat'
import useStreamInfo from '@/hooks/useStreamerInfo'

function StreamPageContent() {
  const nitro = useNitrolite()
  const { isConnected: walletConnected, address } = useAccount()
  const searchParams = useSearchParams()

  const streamId = useMemo(() => {
    return searchParams.get('stream_id') ?? null
  }, [searchParams])

  const { data: streamInfo } = useStreamInfo({ streamId: streamId ?? '' })
  const { videoRef, connectionState, isMuted, unmute } = useWebRTCViewer(streamId)

  const senderName = address ? address.slice(0, 8) : 'Anonymous'
  const senderAddress = address?.toLowerCase() ?? ''
  const chat = useStreamChat(streamId, senderName, senderAddress)

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-6">
      <div className="panel flex items-center justify-between p-4">
        <div className="grid gap-1">
          <div className="text-xs tracking-widest text-white/60">LIVE TIPPING MVP</div>
          <h1 className="text-lg font-extrabold">Yellow Nitrolite + wagmi</h1>
        </div>
        <ConnectButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LiveStream
            videoRef={videoRef}
            connectionState={connectionState}
            streamTitle={streamInfo?.title}
            streamerName={streamInfo?.streamer?.name}
            isMuted={isMuted}
            onUnmute={unmute}
          />
        </div>

        <div className="lg:col-span-5">
          <ViewerSidePanel
            chatContent={
              <ChatPanel
                messages={chat.messages}
                onSendMessage={chat.sendMessage}
                isConnected={chat.isConnected}
                disabled={!walletConnected}
                currentAddress={senderAddress}
              />
            }
            tipsContent={
              <Suspense fallback={
                <div className="p-4">
                  <div className="text-sm font-extrabold">Tipping</div>
                  <div className="mt-2 text-xs text-white/60">Loading...</div>
                </div>
              }>
                <TipPanel />
              </Suspense>
            }
          />
        </div>
      </div>
    </main>
  )
}

export default function StreamPage() {
  return (
    <Suspense>
      <StreamPageContent />
    </Suspense>
  )
}
