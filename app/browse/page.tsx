'use client'

import { useLiveStreams } from '@/hooks/useLiveStreams'
import StreamCard from '@/components/StreamCard'
import PageHeader from '@/components/PageHeader'

export default function BrowsePage() {
  const { data: streams, isLoading, error } = useLiveStreams()

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-6">
      {/* Header */}
      <PageHeader eyebrow="EveryAid - BROWSE" title="Live Streams" />

      {/* Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <div className="text-sm text-muted">Loading streams...</div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <div className="text-sm text-brand-coral">Failed to load streams</div>
        </div>
      ) : !streams || streams.length === 0 ? (
        <>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
            <h2 className="text-lg font-extrabold text-text">No Live Streams</h2>
            <p className="mt-2 text-sm text-muted">
              No one is streaming right now. Check back later!
            </p>
          </div>

          {/* Demo cards showcasing ENS resolution with real addresses */}
          <div className="mt-2">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-subtle">
              Demo Streams — ENS Resolution
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StreamCard
                id="demo-1"
                title="Building the Future of Ethereum"
                streamerName="Vitalik"
                streamerAddress="0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
                startedAt={new Date(Date.now() - 42 * 60_000).toISOString()}
              />
              <StreamCard
                id="demo-2"
                title="ENS Deep Dive"
                streamerName="Brantly"
                streamerAddress="0x983110309620d911731ac0932219af06091b6744"
                startedAt={new Date(Date.now() - 15 * 60_000).toISOString()}
              />
              <StreamCard
                id="demo-3"
                title="Web3 Identity Workshop"
                streamerName="Nick"
                streamerAddress="0x5555763613a12d8f3e73be831dff8598089d3dca"
                startedAt={new Date(Date.now() - 5 * 60_000).toISOString()}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((item) => (
            <StreamCard
              key={item.stream.id}
              id={item.stream.id}
              title={item.stream.title}
              streamerName={item.streamer.display_name}
              streamerAddress={item.streamer.wallet_address}
              streamerAvatar={item.streamer.avatar_url}
              startedAt={item.stream.started_at}
            />
          ))}
        </div>
      )}
    </main>
  )
}
