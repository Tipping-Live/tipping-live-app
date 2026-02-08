'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useHostStream } from '@/hooks/useHostStream'
import ProfileSetupForm from '@/components/host/ProfileSetupForm'
import StreamControlPanel from '@/components/host/StreamControlPanel'
import HostDashboard from '@/components/host/HostDashboard'
import PageHeader from '@/components/PageHeader'

export default function HostPage() {
  const { address, isConnected } = useAccount()
  const wallet = address?.toLowerCase()
  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useUserProfile(wallet)
  const { liveStream, startStream, endStream } = useHostStream(wallet)

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-6">
      <PageHeader
        eyebrow="HOST DASHBOARD"
        title={profile?.display_name ?? 'Tipping Live'}
        rightSlot={<ConnectButton />}
      />

      {!isConnected ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <h2 className="text-lg font-extrabold text-text">Connect Your Wallet</h2>
          <p className="mt-2 text-sm text-muted">
            Connect a wallet to set up your profile and start streaming.
          </p>
        </div>
      ) : isLoadingProfile ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <div className="text-sm text-muted">Loading profile...</div>
        </div>
      ) : !profile ? (
        <ProfileSetupForm wallet={wallet!} onSaved={() => refetchProfile()} />
      ) : liveStream.isLoading ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel shadow-panel backdrop-blur p-8 text-center">
          <div className="text-sm text-muted">Checking stream status...</div>
        </div>
      ) : liveStream.data ? (
        <HostDashboard
          stream={liveStream.data}
          wallet={wallet!}
          onEndStream={() => endStream.mutate(liveStream.data!.id)}
          isEnding={endStream.isPending}
        />
      ) : (
        <StreamControlPanel
          onGoLive={(title) => startStream.mutate({ title })}
          isPending={startStream.isPending}
        />
      )}
    </main>
  )
}
