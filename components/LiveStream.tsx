'use client'

import { type RefObject } from 'react'
import VideoPlayer from '@/components/VideoPlayer'
import type { ViewerConnectionState } from '@/hooks/useWebRTCViewer'
import Badge from '@/components/ui/Badge'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  connectionState: ViewerConnectionState
  streamTitle?: string
  streamerName?: string
  isMuted?: boolean
  onUnmute?: () => void
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`h-8 w-8 animate-spin ${className}`} fill='none' viewBox='0 0 24 24'>
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
      />
    </svg>
  );
}

function ConnectionOverlay({ state }: { state: ViewerConnectionState }) {
  if (state === 'connected') return null

  const content: Record<string, { icon: React.ReactNode; text: string }> = {
    idle: { icon: <Spinner className='text-muted' />, text: 'Waiting for stream...' },
    connecting: { icon: <Spinner className='text-muted' />, text: 'Connecting...' },
    disconnected: { icon: <Spinner className='text-muted' />, text: 'Reconnecting...' },
    failed: {
      icon: (
        <svg className='h-8 w-8 text-danger' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'
          />
        </svg>
      ),
      text: 'Connection failed. Please refresh to retry.',
    },
    'stream-ended': {
      icon: (
        <svg className='h-8 w-8 text-muted' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z'
          />
        </svg>
      ),
      text: 'Stream ended.',
    },
  };

  const c = content[state] ?? content.idle;

  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-overlay backdrop-blur-sm'>
      {c.icon}
      <span className='text-sm text-muted'>{c.text}</span>
    </div>
  );
}

export default function LiveStream({
  videoRef,
  connectionState,
  streamTitle,
  streamerName,
  isMuted,
  onUnmute,
}: Props) {
  const isConnected = connectionState === 'connected';

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur'>
      <div className='flex items-center justify-between gap-3 border-b border-border p-4'>
        <div className='min-w-0'>
          <div className='text-xs tracking-widest text-muted'>LIVE</div>
          <h2 className='truncate text-lg font-extrabold text-text'>{streamTitle || 'Stream'}</h2>
          {streamerName && <div className='mt-0.5 text-xs text-subtle'>{streamerName}</div>}

          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-2.5 py-1 text-xs text-text shadow-sm backdrop-blur'>
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-primary' : 'bg-border2'
                }`}
              />
              <span className='text-muted'>{isConnected ? 'Live' : connectionState}</span>
            </span>

            {/* Optional: consistent Badge usage */}
            {isConnected && <Badge value='LIVE' tone='success' />}
          </div>
        </div>
      </div>

      <VideoPlayer
        videoRef={videoRef}
        muted={isMuted}
        showVideo={isConnected}
        overlay={
          <>
            <ConnectionOverlay state={connectionState} />
            {isConnected && isMuted && onUnmute && (
              <button
                onClick={onUnmute}
                className='absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-panel2 px-3 py-1.5 text-xs text-text shadow-glow backdrop-blur transition hover:border-border2'
              >
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15Z'
                  />
                  <path strokeLinecap='round' strokeLinejoin='round' d='m17 14 2-2m0 0 2-2m-2 2-2-2m2 2 2 2' />
                </svg>
                Click to unmute
              </button>
            )}
          </>
        }
        placeholder={<div className='text-sm text-muted'>No video signal</div>}
      />
    </div>
  );
}
