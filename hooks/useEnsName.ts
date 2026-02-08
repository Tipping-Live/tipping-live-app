'use client'

import { useQuery } from '@tanstack/react-query'
import { mainnetClient } from '@/lib/ens'

// Well-known addresses with verified ENS reverse records.
// Used as fallback when RPC is unavailable or rate-limited,
// so demo / hackathon environments still show ENS badges.
const KNOWN_ENS: Record<string, string> = {
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': 'vitalik.eth',
  '0x983110309620d911731ac0932219af06091b6744': 'brantly.eth',
  '0x5555763613a12d8f3e73be831dff8598089d3dca': 'nick.eth',
}

export function useEnsName(address: string | undefined) {
  return useQuery<string | null>({
    queryKey: ['ensName', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null
      const lower = address.toLowerCase()

      // Try real ENS reverse resolution first
      try {
        const name = await mainnetClient.getEnsName({
          address: address as `0x${string}`,
        })
        if (name) return name
      } catch {
        // RPC failed — fall through to known-address lookup
      }

      // Fallback: known addresses with verified ENS reverse records
      return KNOWN_ENS[lower] ?? null
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}
