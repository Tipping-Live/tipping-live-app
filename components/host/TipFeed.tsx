'use client'

import EnsName from '@/components/ui/EnsName'

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
}

export default function TipFeed({ tips }: Props) {
  if (tips.length === 0) {
    return (
      <div>
        <div className="py-8 text-center text-sm text-subtle">
          No tips yet. Share your viewer link to start receiving tips!
        </div>

        {/* Demo tip showcasing ENS resolution */}
        <div className="opacity-60">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Demo — ENS Preview
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-panel2 px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text">
                5 <span className="font-semibold text-muted">ytest.usd</span>
              </div>
              <div className="text-xs text-subtle">
                from <EnsName address="0xd8da6bf26964af9d7eed9e03e53415d37aa96045" fallbackLength={6} />
                <span className="ml-2 text-muted">&ldquo;Great stream!&rdquo;</span>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-muted">
              DEMO
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="grid gap-2">
        {tips.map((tip) => {
          const from = tip.from_address || tip.fromAccount || 'unknown'
          const tokenLabel = tip.token || tip.asset || ''
          const time = tip.created_at || tip.createdAt

          return (
            <div
              key={tip.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel2 px-3 py-2 shadow-sm"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text">
                  {tip.amount}{' '}
                  <span className="font-semibold text-muted">{tokenLabel}</span>
                </div>

                <div className="text-xs text-subtle">
                  from <EnsName address={from} fallbackLength={6} />
                  {tip.memo && (
                    <span className="ml-2 text-muted">&ldquo;{tip.memo}&rdquo;</span>
                  )}
                </div>
              </div>

              {time && (
                <div className="shrink-0 text-xs text-subtle">
                  {new Date(time).toLocaleTimeString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
