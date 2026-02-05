'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Stream {
  id: string
  streamer_wallet: string
  title: string
  status: 'live' | 'ended'
  started_at: string
  ended_at: string | null
  created_at: string
}

export function useHostStream(wallet: string | undefined) {
  const queryClient = useQueryClient()

  const liveStream = useQuery<Stream | null>({
    queryKey: ['hostLiveStream', wallet],
    queryFn: async () => {
      const res = await fetch(`/api/streams?wallet=${wallet}`)
      if (!res.ok) throw new Error('Failed to fetch live stream')
      const json = await res.json()
      return json.stream ?? null
    },
    enabled: !!wallet,
  })

  const startStream = useMutation({
    mutationFn: async (params: { title?: string }) => {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer_wallet: wallet, title: params.title }),
      })
      if (!res.ok) throw new Error('Failed to start stream')
      const json = await res.json()
      return json.stream as Stream
    },
    onSuccess: (stream) => {
      queryClient.setQueryData(['hostLiveStream', wallet], stream)
    },
  })

  const endStream = useMutation({
    mutationFn: async (streamId: string) => {
      const res = await fetch(`/api/streams/${streamId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer_wallet: wallet }),
      })
      if (!res.ok) throw new Error('Failed to end stream')
      const json = await res.json()
      return json.stream as Stream
    },
    onSuccess: () => {
      queryClient.setQueryData(['hostLiveStream', wallet], null)
    },
  })

  return { liveStream, startStream, endStream }
}
