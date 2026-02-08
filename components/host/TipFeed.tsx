'use client'

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

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function TipFeed({ tips }: Props) {
  if (tips.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-subtle">
        No tips yet. Share your viewer link to start receiving tips!
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
                  from {truncateAddress(from)}
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
