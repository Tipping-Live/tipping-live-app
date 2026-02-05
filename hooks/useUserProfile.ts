'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface UserProfile {
  wallet_address: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile(wallet: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', wallet],
    queryFn: async () => {
      const res = await fetch(`/api/users?wallet=${wallet}`)
      if (!res.ok) throw new Error('Failed to fetch user profile')
      const json = await res.json()
      return json.user ?? null
    },
    enabled: !!wallet,
  })
}

export function useUpsertUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { wallet_address: string; display_name: string; avatar_url?: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Failed to save user profile')
      const json = await res.json()
      return json.user as UserProfile
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['userProfile', user.wallet_address], user)
    },
  })
}
