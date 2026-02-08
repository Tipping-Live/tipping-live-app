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
  onClaim?: () => void
  isClaiming?: boolean
  claimStatus?: 'idle' | 'fetching' | 'closing' | 'closed' | 'error'
  balance?: string | null
}

export default function TipsDashboard({ tips, totals, count, onClaim, isClaiming, claimStatus, balance }: Props) {
  const totalDisplay =
    Object.entries(totals)
      .map(([token, amount]) => `${amount} ${token}`)
      .join(', ') || '0'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur">
      <div className="border-b border-border p-4">
        <div className="text-sm font-extrabold text-text">Donations Received</div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-border p-4">
        <div>
          <div className="text-xs text-muted">Total</div>
          <div className="mt-1 text-xl font-extrabold text-text">{totalDisplay}</div>
          {balance && (
            <div className="mt-0.5 text-xs text-muted">ClearNode: {balance} ytest.usd</div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted">Count</div>
          <div className="mt-1 text-xl font-extrabold text-text">{count}</div>
        </div>
      </div>

      <div className="p-4">
        {isClaiming || claimStatus === 'closed' ? (
          <button
            className="w-full rounded-xl border border-border bg-panel2 px-4 py-2 text-sm font-semibold text-muted shadow-sm"
            disabled
          >
            {claimStatus === 'closed' ? 'Claimed!' : 'Claiming...'}
          </button>
        ) : (
          <button
            className="btn-primary w-full"
            disabled={!onClaim}
            onClick={onClaim}
          >
            Claim Donations
          </button>
        )}
        {claimStatus === 'error' && (
          <div className="mt-1 text-xs text-red-400">Claim failed. Try again.</div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-2 text-xs text-muted">Recent Donations</div>
        <TipFeed tips={tips} />
      </div>
    </div>
  )
}
