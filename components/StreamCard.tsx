'use client'

import Link from 'next/link'
import Badge from '@/components/ui/Badge'

interface StreamCardProps {
  id: string
  title: string
  streamerName: string
  streamerAvatar?: string | null
  startedAt: string
}

function getElapsed(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just started'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

export default function StreamCard({ id, title, streamerName, streamerAvatar, startedAt }: StreamCardProps) {
  const elapsed = getElapsed(startedAt)

  return (
    <Link
      href={`/stream?stream_id=${id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-panel shadow-panel backdrop-blur transition hover:border-border2 hover:shadow-glow"
    >
      {/* Thumbnail placeholder */}
      <div className="flex aspect-video items-center justify-center bg-brand-soft">
        <span className="text-xs font-semibold tracking-widest text-muted">LIVE</span>
      </div>

      {/* Stream info */}
      <div className="p-4">
        <h3 className="text-sm font-extrabold text-text truncate">{title}</h3>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-white flex items-center justify-center text-[10px] font-bold text-text">
              {streamerAvatar ? (
                <img
                  src={streamerAvatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                streamerName.charAt(0).toUpperCase()
              )}
            </div>

            <span className="text-xs text-muted truncate">{streamerName}</span>
          </div>

          <Badge label="" value="LIVE" tone="success" />
        </div>

        <div className="mt-2 text-[10px] text-subtle">{elapsed}</div>
      </div>
    </Link>
  )
}
