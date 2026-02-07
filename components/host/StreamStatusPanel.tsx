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

export default function StreamStatusPanel({ stream, wsStatus, onEndStream, isEnding, viewerCount = 0 }: Props) {
  const [copied, setCopied] = useState(false)
  const viewerUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/stream?stream_id=${stream.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(viewerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
              {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
              WS: {wsStatus}
            </span>
          </div>
          <h2 className="mt-2 truncate text-lg font-extrabold">{stream.title}</h2>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div>
          <div className="label">Stream ID</div>
          <div className="mt-1 truncate text-xs font-mono text-white/80">{stream.id}</div>
        </div>

        <div>
          <div className="label">Viewer Link</div>
          <div className="mt-1 flex items-center gap-2">
            <input className="input flex-1 text-xs" value={viewerUrl} readOnly />
            <button className="btn-secondary text-xs" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <div className="label">Started At</div>
          <div className="mt-1 text-xs text-white/80">
            {new Date(stream.started_at).toLocaleString()}
          </div>
        </div>

        <button
          className="btn-danger mt-2"
          onClick={onEndStream}
          disabled={isEnding}
        >
          {isEnding ? 'Ending...' : 'End Stream'}
        </button>
      </div>
    </div>
  )
}
