'use client'

import TipFeed from './TipFeed'

interface TipItem {
  id: string
  from_address?: string
  fromAccount?: string
  amount: string
  token?: string
  asset?: string
  memo?: string
  created_at?: string
  createdAt?: string
}

interface Props {
  tips: TipItem[]
  totals: Record<string, number>
  count: number
}

export default function TipsDashboard({ tips, totals, count }: Props) {
  const totalDisplay =
    Object.entries(totals)
      .map(([token, amount]) => `${amount} ${token}`)
      .join(', ') || '0'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur">
      <div className="border-b border-border p-4">
        <div className="text-sm font-extrabold text-text">Tips Received</div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-border p-4">
        <div>
          <div className="text-xs text-muted">Total</div>
          <div className="mt-1 text-xl font-extrabold text-text">{totalDisplay}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Count</div>
          <div className="mt-1 text-xl font-extrabold text-text">{count}</div>
        </div>
      </div>

      <div className="p-4">
        <button
          className="w-full rounded-xl border border-border bg-panel2 px-4 py-2 text-sm font-semibold text-muted shadow-sm"
          disabled
        >
          Claim Tips (Coming Soon)
        </button>
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-2 text-xs text-muted">Recent Tips</div>
        <TipFeed tips={tips} />
      </div>
    </div>
  )
}
