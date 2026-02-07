'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useHostNitrolite } from '@/lib/nitrolite/useHostNitrolite'
import { useStreamTips } from '@/hooks/useStreamTips'
import { useMediaStream } from '@/hooks/useMediaStream'
import { useWebRTCHost } from '@/hooks/useWebRTCHost'
import StreamStatusPanel from './StreamStatusPanel'
import TipsDashboard from './TipsDashboard'
import HostVideoPreview from './HostVideoPreview'
import type { RPCTransaction } from '@erc7824/nitrolite'

interface Stream {
  id: string
  streamer_wallet: string
  title: string
  status: string
  started_at: string
}

interface Props {
  stream: Stream
  wallet: string
  onEndStream: () => void
  isEnding: boolean
}

export default function HostDashboard({ stream, wallet, onEndStream, isEnding }: Props) {
  const nitro = useHostNitrolite()
  const { data: dbTips } = useStreamTips(stream.id)
  const media = useMediaStream()
  const webrtcHost = useWebRTCHost(stream.id, media.stream)
  const hasConnectedRef = useRef(false)
  const hasStartedCaptureRef = useRef(false)

  // Auto-start camera capture on mount
  useEffect(() => {
    if (!hasStartedCaptureRef.current) {
      hasStartedCaptureRef.current = true
      media.startCapture()
    }
  }, [])

  // Auto-connect WebSocket and run auth flow
  useEffect(() => {
    if (!nitro.canWork || hasConnectedRef.current) return
    if (nitro.status === 'idle') {
      hasConnectedRef.current = true
      try { nitro.connectWs() } catch { /* ignore */ }
    }
  }, [nitro.canWork, nitro.status])

  useEffect(() => {
    if (nitro.status === 'ws_connected') {
      nitro.requestAuth().catch(() => {})
    }
  }, [nitro.status])

  useEffect(() => {
    if (nitro.status === 'auth_challenged' && nitro.challenge) {
      nitro.verifyAuth().catch(() => {})
    }
  }, [nitro.status, nitro.challenge])

  // Persist incoming tips to DB
  const persistTips = useCallback(async (txs: RPCTransaction[]) => {
    for (const tx of txs) {
      try {
        await fetch('/api/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stream_id: stream.id,
            from_address: String(tx.fromAccount),
            to_address: String(tx.toAccount),
            token: tx.asset,
            amount: tx.amount,
            memo: '',
            tx_type: tx.txType,
            clearnode_tx_id: tx.id,
          }),
        })
      } catch { /* best-effort persistence */ }
    }
  }, [stream.id])

  useEffect(() => {
    nitro.setOnTipReceived(persistTips)
  }, [nitro.setOnTipReceived, persistTips])

  // Merge WebSocket live tips with DB tips, deduplicate by clearnode_tx_id
  const mergedTips = useMemo(() => {
    const dbItems = (dbTips?.tips ?? []).map((t) => ({
      id: t.id,
      from_address: t.from_address,
      amount: t.amount,
      token: t.token,
      memo: t.memo,
      created_at: t.created_at,
      _clearnodeId: t.clearnode_tx_id,
    }))

    const dbClearnodeIds = new Set(dbItems.map((t) => t._clearnodeId).filter(Boolean))

    const wsItems = nitro.tips
      .filter((tx) => !dbClearnodeIds.has(tx.id))
      .map((tx) => ({
        id: `ws-${tx.id}`,
        from_address: String(tx.fromAccount),
        amount: tx.amount,
        token: tx.asset,
        memo: '',
        created_at: new Date(tx.createdAt).toISOString(),
        _clearnodeId: tx.id,
      }))

    return [...wsItems, ...dbItems]
  }, [nitro.tips, dbTips])

  const totals = useMemo(() => {
    const result: Record<string, number> = { ...(dbTips?.totals ?? {}) }
    // Add WS-only tips that aren't in DB yet
    for (const tip of mergedTips) {
      if (tip.id.startsWith('ws-')) {
        const token = tip.token || 'unknown'
        result[token] = (result[token] || 0) + parseFloat(tip.amount || '0')
      }
    }
    return result
  }, [mergedTips, dbTips?.totals])

  const handleEndStream = useCallback(() => {
    webrtcHost.cleanup()
    media.stopCapture()
    onEndStream()
  }, [webrtcHost, media, onEndStream])

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7 grid gap-4">
        <HostVideoPreview
          videoRef={media.videoRef}
          hasStream={!!media.stream}
          error={media.error}
          viewerCount={webrtcHost.viewerCount}
        />
        <StreamStatusPanel
          stream={stream}
          wsStatus={nitro.status}
          onEndStream={handleEndStream}
          isEnding={isEnding}
          viewerCount={webrtcHost.viewerCount}
        />
      </div>

      <div className="lg:col-span-5">
        <TipsDashboard
          tips={mergedTips}
          totals={totals}
          count={mergedTips.length}
        />
      </div>
    </div>
  )
}
