'use client'

import { useEnsName } from '@/hooks/useEnsName'

interface Props {
  address: string
  displayName?: string
  fallbackLength?: number
  className?: string
}

function truncateAddress(addr: string, length: number) {
  if (addr.length <= length + 4) return addr
  const half = Math.floor(length / 2)
  return `${addr.slice(0, half + 2)}...${addr.slice(-half)}`
}

function VerifiedBadge({ ensName }: { ensName: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-white/60 px-1.5 py-0.5 text-[10px] backdrop-blur">
      <svg
        className="h-2.5 w-2.5 text-primary"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.563 2 12.162 2 7c0-.54.035-1.07.104-1.59a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.748Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-muted">{ensName}</span>
    </span>
  )
}

export default function EnsName({
  address,
  displayName,
  fallbackLength = 8,
  className,
}: Props) {
  const { data: ensName } = useEnsName(address)

  const primaryLabel = displayName || ensName || truncateAddress(address, fallbackLength)
  const showBadge = ensName && displayName

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <span>{primaryLabel}</span>
      {showBadge && <VerifiedBadge ensName={ensName} />}
    </span>
  )
}
