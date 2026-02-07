'use client'

import { type RefObject } from 'react'
import VideoPlayer from '@/components/VideoPlayer'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  hasStream: boolean
  error: string | null
  viewerCount?: number
}

export default function HostVideoPreview({ videoRef, hasStream, error, viewerCount = 0 }: Props) {
  return (
    <div className="panel overflow-hidden">
      <VideoPlayer
        videoRef={videoRef}
        muted
        showVideo={hasStream}
        placeholder={
          <div className="flex flex-col items-center gap-2 text-white/50">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-sm">
              {error || 'Camera Off'}
            </span>
          </div>
        }
        overlay={
          hasStream ? (
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-black/40 px-2.5 py-1 text-xs text-red-300 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/80 backdrop-blur">
                {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
              </span>
            </div>
          ) : null
        }
      />
    </div>
  )
}
