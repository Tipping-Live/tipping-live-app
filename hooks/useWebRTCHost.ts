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

export function useWebRTCHost(streamId: string | null, localStream: MediaStream | null) {
  const [viewerCount, setViewerCount] = useState(0)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const updateViewerCount = useCallback(() => {
    setViewerCount(peersRef.current.size)
  }, [])

  const cleanupPeer = useCallback((viewerId: string) => {
    const peer = peersRef.current.get(viewerId)
    if (peer) {
      peer.close()
      peersRef.current.delete(viewerId)
      updateViewerCount()
    }
  }, [updateViewerCount])

  const handleViewerJoin = useCallback(
    async (viewerId: string) => {
      if (!localStream || !channelRef.current) return

      // Clean up existing peer for this viewer (reconnect scenario)
      cleanupPeer(viewerId)

      const peer = new RTCPeerConnection(RTC_CONFIG)
      peersRef.current.set(viewerId, peer)
      updateViewerCount()

      // Add local tracks to the peer connection
      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream)
      })

      // Send ICE candidates to the viewer
      peer.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              viewerId,
              candidate: event.candidate.toJSON(),
              sender: 'host',
            },
          })
        }
      }

      // Track connection state to detect viewer disconnection
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
          cleanupPeer(viewerId)
        }
      }

      // Create and send offer
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)

      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          viewerId,
          sdp: peer.localDescription,
        },
      })
    },
    [localStream, cleanupPeer, updateViewerCount],
  )

  const handleAnswer = useCallback(
    async (viewerId: string, sdp: RTCSessionDescriptionInit) => {
      const peer = peersRef.current.get(viewerId)
      if (!peer) return
      await peer.setRemoteDescription(new RTCSessionDescription(sdp))
    },
    [],
  )

  const handleIceCandidate = useCallback(
    async (viewerId: string, candidate: RTCIceCandidateInit) => {
      const peer = peersRef.current.get(viewerId)
      if (!peer) return
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        // ICE candidate may arrive before remote description is set; safe to ignore
      }
    },
    [],
  )

  // Subscribe to signaling channel
  useEffect(() => {
    if (!streamId || !localStream) return

    const supabase = supabaseRef.current
    const channel = supabase.channel(`stream-signal:${streamId}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'viewer-join' }, ({ payload }) => {
        handleViewerJoin(payload.viewerId)
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        handleAnswer(payload.viewerId, payload.sdp)
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.sender === 'viewer') {
          handleIceCandidate(payload.viewerId, payload.candidate)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      // Broadcast stream-ended before leaving
      channel.send({
        type: 'broadcast',
        event: 'stream-ended',
        payload: {},
      })
      supabase.removeChannel(channel)
      channelRef.current = null

      // Close all peer connections
      peersRef.current.forEach((peer) => peer.close())
      peersRef.current.clear()
      setViewerCount(0)
    }
  }, [streamId, localStream, handleViewerJoin, handleAnswer, handleIceCandidate])

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stream-ended',
        payload: {},
      })
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }
    peersRef.current.forEach((peer) => peer.close())
    peersRef.current.clear()
    setViewerCount(0)
  }, [])

  return { viewerCount, cleanup }
}
