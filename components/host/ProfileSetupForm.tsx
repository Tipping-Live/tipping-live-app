'use client'

import { useState } from 'react'
import { useUpsertUserProfile } from '@/hooks/useUserProfile'

interface Props {
  wallet: string
  onSaved: () => void
}

export default function ProfileSetupForm({ wallet, onSaved }: Props) {
  const [displayName, setDisplayName] = useState('')
  const upsert = useUpsertUserProfile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    await upsert.mutateAsync({ wallet_address: wallet, display_name: displayName.trim() })
    onSaved()
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-6">
      <h2 className="text-lg font-extrabold text-text">Set Up Your Profile</h2>
      <p className="mt-1 text-sm text-muted">Choose a display name before going live.</p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <div>
          <label className="text-xs text-muted">Display Name</label>
          <input
            className="mt-1 w-full rounded-xl border border-border bg-panel2 px-3 py-2 text-sm text-text shadow-sm outline-none
                       placeholder:text-subtle focus:border-border2 focus:ring-2 focus:ring-ring"
            placeholder="Your streamer name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90
                     disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!displayName.trim() || upsert.isPending}
        >
          {upsert.isPending ? 'Saving...' : 'Save Profile'}
        </button>

        {upsert.isError && (
          <p className="text-xs text-danger">Failed to save profile. Please try again.</p>
        )}
      </form>
    </div>
  )
}
