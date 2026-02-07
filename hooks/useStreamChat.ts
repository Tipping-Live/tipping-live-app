'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  senderName: string
  senderAddress: string
  text: string
  timestamp: number
}

const MAX_MESSAGES = 200

export function useStreamChat(
  streamId: string | null,
  senderName: string,
  senderAddress: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const sendMessage = useCallback(
    (text: string) => {
      if (!channelRef.current || !text.trim()) return

      channelRef.current.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: {
          id: crypto.randomUUID(),
          senderName,
          senderAddress,
          text: text.trim(),
          timestamp: Date.now(),
        },
      })
    },
    [senderName, senderAddress],
  )

  useEffect(() => {
    if (!streamId) return

    const supabase = supabaseRef.current
    const channel = supabase.channel(`stream-chat:${streamId}`, {
      config: { broadcast: { self: true } },
    })

    channel
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setMessages((prev) => {
          const next = [...prev, payload as ChatMessage]
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
        })
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsConnected(false)
      setMessages([])
    }
  }, [streamId])

  return { messages, sendMessage, isConnected }
}
