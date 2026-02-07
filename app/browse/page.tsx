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
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <h2 className="text-lg font-extrabold text-text">No Live Streams</h2>
          <p className="mt-2 text-sm text-muted">
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
