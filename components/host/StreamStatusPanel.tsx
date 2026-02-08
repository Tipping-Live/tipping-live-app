'use client'

import { useState } from 'react'
import type { NitroliteStatus } from '@/lib/nitrolite/types'

interface Stream {
  id: string
  title: string
  status: string
  started_at: string
}

interface Props {
  stream: Stream
  wsStatus: NitroliteStatus
  onEndStream: () => void
  isEnding: boolean
  viewerCount?: number
}

export default function StreamStatusPanel({
  stream,
  wsStatus,
  onEndStream,
  isEnding,
  viewerCount = 0,
}: Props) {
  const [copied, setCopied] = useState(false)
  const viewerUrl =
    `${typeof window !== 'undefined' ? window.location.origin : ''}/stream?stream_id=${stream.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(viewerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 text-xs text-danger shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              LIVE
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel2 px-2.5 py-0.5 text-xs text-text shadow-sm">
              {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel2 px-2.5 py-0.5 text-xs text-muted shadow-sm">
              WS: {wsStatus}
            </span>
          </div>

          <h2 className="mt-2 truncate text-lg font-extrabold text-text">
            {stream.title}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4 p-4">
        <div>
          <div className="text-xs text-muted">Stream ID</div>
          <div className="mt-1 truncate text-xs font-mono text-text">
            {stream.id}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted">Viewer Link</div>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="flex-1 rounded-xl border border-border bg-panel2 px-3 py-2 text-xs text-text shadow-sm outline-none"
              value={viewerUrl}
              readOnly
            />
            <button
              className="rounded-xl border border-border bg-panel2 px-3 py-2 text-xs font-semibold text-text shadow-sm transition hover:border-border2"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted">Started At</div>
          <div className="mt-1 text-xs text-text">
            {new Date(stream.started_at).toLocaleString()}
          </div>
        </div>

        <button
          className="mt-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90
                     disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onEndStream}
          disabled={isEnding}
        >
          {isEnding ? 'Ending...' : 'End Stream'}
        </button>
      </div>
    </div>
  )
}
