'use client'

import { useQuery } from '@tanstack/react-query'

interface Tip {
  id: string
  stream_id: string
  from_address: string
  to_address: string
  token: string
  amount: string
  memo: string
  tx_type: string
  clearnode_tx_id: number | null
  created_at: string
}

interface TipsResponse {
  tips: Tip[]
  totals: Record<string, number>
  count: number
}

export function useStreamTips(streamId: string | undefined) {
  return useQuery<TipsResponse>({
    queryKey: ['streamTips', streamId],
    queryFn: async () => {
      const res = await fetch(`/api/tips?stream_id=${streamId}`)
      if (!res.ok) throw new Error('Failed to fetch tips')
      return res.json()
    },
    enabled: !!streamId,
    refetchInterval: 10_000,
  })
}
