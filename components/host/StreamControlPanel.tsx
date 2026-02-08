'use client'

import { useState } from 'react'

interface Props {
  onGoLive: (title: string) => void
  isPending: boolean
}

export default function StreamControlPanel({ onGoLive, isPending }: Props) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGoLive(title.trim() || 'Untitled Broadcast')
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-6">
      <h2 className="text-lg font-extrabold text-text">Start a Live Broadcast</h2>
      <p className="mt-1 text-sm text-muted">
        Describe the situation and go live to receive instant support from around the world.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <div>
          <label className="text-xs text-muted">Broadcast Title</label>
          <input
            className="mt-1 w-full rounded-xl border border-border bg-panel2 px-3 py-2 text-sm text-text shadow-sm outline-none
                       placeholder:text-subtle focus:border-border2 focus:ring-2 focus:ring-ring"
            placeholder="Describe the situation or needs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90
                     disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? 'Starting...' : 'Go Live'}
        </button>
      </form>
    </div>
  )
}
