'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useLiveStreams } from '@/hooks/useLiveStreams'
import StreamCard from '@/components/StreamCard'

export default function BrowsePage() {
  const { data: streams, isLoading, error } = useLiveStreams()

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-6">
      {/* Header */}
      <div className="panel flex items-center justify-between p-4">
        <div className="grid gap-1">
          <div className="text-xs tracking-widest text-white/60">BROWSE</div>
          <h1 className="text-lg font-extrabold">Live Streams</h1>
        </div>
        <ConnectButton />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="panel p-8 text-center">
          <div className="text-sm text-white/60">Loading streams...</div>
        </div>
      ) : error ? (
        <div className="panel p-8 text-center">
          <div className="text-sm text-red-400">Failed to load streams</div>
        </div>
      ) : !streams || streams.length === 0 ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-extrabold">No Live Streams</h2>
          <p className="mt-2 text-sm text-white/60">
            No one is streaming right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((item) => (
            <StreamCard
              key={item.stream.id}
              id={item.stream.id}
              title={item.stream.title}
              streamerName={item.streamer.display_name}
              streamerAvatar={item.streamer.avatar_url}
              startedAt={item.stream.started_at}
            />
          ))}
        </div>
      )}
    </main>
  )
}
