'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useHostStream } from '@/hooks/useHostStream'
import ProfileSetupForm from '@/components/host/ProfileSetupForm'
import StreamControlPanel from '@/components/host/StreamControlPanel'
import HostDashboard from '@/components/host/HostDashboard'

export default function HostPage() {
  const { address, isConnected } = useAccount()
  const wallet = address?.toLowerCase()
  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useUserProfile(wallet)
  const { liveStream, startStream, endStream } = useHostStream(wallet)

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-6">
      {/* Header */}
      <div className="panel flex items-center justify-between p-4">
        <div className="grid gap-1">
          <div className="text-xs tracking-widest text-white/60">HOST DASHBOARD</div>
          <h1 className="text-lg font-extrabold">
            {profile?.display_name ?? 'Tipping Live'}
          </h1>
        </div>
        <ConnectButton />
      </div>

      {/* State machine */}
      {!isConnected ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-extrabold">Connect Your Wallet</h2>
          <p className="mt-2 text-sm text-white/60">
            Connect a wallet to set up your profile and start streaming.
          </p>
        </div>
      ) : isLoadingProfile ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <div className="text-sm text-white/60">Loading profile...</div>
        </div>
      ) : !profile ? (
        <ProfileSetupForm wallet={wallet!} onSaved={() => refetchProfile()} />
      ) : liveStream.isLoading ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <div className="text-sm text-white/60">Checking stream status...</div>
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
