'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export type ViewerConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'stream-ended'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export function useWebRTCViewer(streamId: string | null) {
  const [connectionState, setConnectionState] = useState<ViewerConnectionState>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const viewerIdRef = useRef(crypto.randomUUID())
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // After srcObject is set, autoPlay will try unmuted playback.
  // If the browser blocks it, fall back to muted playback.
  const ensurePlayback = useCallback((video: HTMLVideoElement) => {
    // Give autoPlay a moment to kick in, then check if it was blocked
    setTimeout(() => {
      if (video.paused && video.srcObject) {
        video.muted = true
        setIsMuted(true)
        video.play().catch(() => {})
      }
    }, 500)
  }, [])

  const unmute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false
      setIsMuted(false)
    }
  }, [])

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
  }, [])

  const joinStream = useCallback(() => {
    if (!channelRef.current) return
    setConnectionState('connecting')
    channelRef.current.send({
      type: 'broadcast',
      event: 'viewer-join',
      payload: { viewerId: viewerIdRef.current },
    })
  }, [])

  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      if (!channelRef.current) return

      cleanupPeer()

      const peer = new RTCPeerConnection(RTC_CONFIG)
      peerRef.current = peer
      const viewerId = viewerIdRef.current

      // Store remote stream, attach to video element, let autoPlay handle it
      peer.ontrack = (event) => {
        if (event.streams[0]) {
          remoteStreamRef.current = event.streams[0]
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0]
            ensurePlayback(videoRef.current)
          }
        }
      }

      // Send ICE candidates to host
      peer.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              viewerId,
              candidate: event.candidate.toJSON(),
              sender: 'viewer',
            },
          })
        }
      }

      // Track connection state
      peer.onconnectionstatechange = () => {
        const state = peer.connectionState
        if (state === 'connected') {
          setConnectionState('connected')
          retryCountRef.current = 0
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionState('disconnected')
          cleanupPeer()
          // Auto-retry
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++
            retryTimerRef.current = setTimeout(() => {
              joinStream()
            }, RETRY_DELAY_MS)
          } else {
            setConnectionState('failed')
          }
        }
      }

      await peer.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)

      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          viewerId,
          sdp: peer.localDescription,
        },
      })
    },
    [cleanupPeer, joinStream],
  )

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const peer = peerRef.current
    if (!peer) return
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate))
    } catch {
      // ICE candidate may arrive before remote description is set
    }
  }, [])

  // Attach remote stream to video element when connection is established
  // This covers the case where ontrack fires before the video element is in the DOM
  useEffect(() => {
    if (connectionState === 'connected' && videoRef.current && remoteStreamRef.current) {
      videoRef.current.srcObject = remoteStreamRef.current
      ensurePlayback(videoRef.current)
    }
  }, [connectionState, ensurePlayback])

  // Subscribe to signaling channel
  useEffect(() => {
    if (!streamId) return

    const supabase = supabaseRef.current
    const viewerId = viewerIdRef.current

    const channel = supabase.channel(`stream-signal:${streamId}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.viewerId === viewerId) {
          handleOffer(payload.sdp)
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.sender === 'host' && payload.viewerId === viewerId) {
          handleIceCandidate(payload.candidate)
        }
      })
      .on('broadcast', { event: 'stream-ended' }, () => {
        cleanupPeer()
        setConnectionState('stream-ended')
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send viewer-join once channel is ready
          joinStream()
        }
      })

    channelRef.current = channel

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
      cleanupPeer()
      supabase.removeChannel(channel)
      channelRef.current = null
      setConnectionState('idle')
    }
  }, [streamId, handleOffer, handleIceCandidate, cleanupPeer, joinStream])

  return { videoRef, connectionState, isMuted, unmute }
}
