'use client'

import { type RefObject, type ReactNode } from 'react'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  muted?: boolean
  className?: string
  overlay?: ReactNode
  placeholder?: ReactNode
  showVideo?: boolean
}

export default function VideoPlayer({
  videoRef,
  muted = false,
  className = '',
  overlay,
  placeholder,
  showVideo = true,
}: Props) {
  return (
    <div className={`relative aspect-video w-full bg-black ${className}`}>
      {/* Always render video so the ref stays attached for WebRTC ontrack */}
      <video
        ref={videoRef as React.LegacyRef<HTMLVideoElement>}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 h-full w-full object-contain ${showVideo ? '' : 'hidden'}`}
      />
      {!showVideo && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder}
        </div>
      )}
      {overlay && <div className="absolute inset-0">{overlay}</div>}
    </div>
  )
}
