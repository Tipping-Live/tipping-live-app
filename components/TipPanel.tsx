"use client";

import { useMemo, useState } from "react";
import useStreamInfo from "@/hooks/useStreamerInfo";
import { useSearchParams } from "next/navigation";
import TokenSelector, { TokenOption } from "@/components/ui/TokenSelector";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useNitrolite } from "@/lib/nitrolite/useNitrolite";
import { useAccount } from "wagmi";
import { useBalanceOf } from "@/hooks/useBalanceOf";

const TOKENS: TokenOption[] = [
  {
    symbol: "ytest.USD",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    enabled: true,
    badge: "Available",
  },
  {
    symbol: "USDC",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 6,
    enabled: false,
    badge: "Coming soon",
  },
  {
    symbol: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    enabled: false,
    badge: "Coming soon",
  },
];

export default function TipPanel() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState("1");
  const [memo, setMemo] = useState("Nice stream!");
  const [isRequestingTokens, setIsRequestingTokens] = useState(false)
  const searchParams = useSearchParams();
  const {
    canWork,
    status,
    lastError,
    connectWs,
    disconnectWs,
    requestAuth,
    verifyAuth,
    sendTip,
  } = useNitrolite();

  const [selectedToken, setSelectedToken] = useState<TokenOption>(() => {
    const firstEnabled = TOKENS.find((t) => t.enabled);
    return firstEnabled ?? TOKENS[0];
  });

  const streamIdFromParams = useMemo(() => {
    return searchParams.get("stream_id") ?? "";
  }, [searchParams]);

  const { data: streamerInfo } = useStreamInfo({
    streamId: streamIdFromParams!,
  });

  const authVerified = useMemo(() => {
    return status === "auth_verified";
  }, [status])

  const {
    balance: selectedTokenBalance,
    isLoadingBalance: isLoadingSelectedTokenBalance,
    refetchBalance: refetchSelectedTokenBalance,
  } = useBalanceOf(selectedToken.address, address);

  const isInsufficientBalance = useMemo(() => {
    return selectedTokenBalance && amount && (selectedTokenBalance < parseInt(amount, selectedToken.decimals))
  }, [selectedTokenBalance, amount, selectedToken])

  const needAuthVerify = useMemo(() => {
    return status !== "idle";
  }, [authVerified])

  const warningMessage = useMemo(() => {
    if (!isConnected) return {
        title: "Wallet is not connected.",
    }
    if (!authVerified) return {
        title: "Unauthrized",
    }
    if (!isInsufficientBalance) return {
        title: `Insufficient ${selectedToken.symbol} to send tip.`
    }
  }, [
    authVerified,
    isConnected,
    isInsufficientBalance
])

const isStreamInfoReady = Boolean(streamerInfo?.id && streamerInfo?.streamer?.address);

  const sendTipButtonEnabled = useMemo(() => {
    return isStreamInfoReady && !!(Number(amount)) && authVerified && isConnected && !isInsufficientBalance;
  }, [
    amount,
    authVerified,
    isConnected,
    isInsufficientBalance,
    isStreamInfoReady,
  ])

  const handleAuthVerify = async () => {
    // TODO: handle connect ws, request auth, and verify auth
  }

  const handleSendTip = async () => {
    // TODO: implment send tip
    sendTip({
        streamId: streamerInfo!.id,
        streamer: streamerInfo!.streamer!.address as `0x${string}`,
        token: selectedToken.address,
        amount,
        memo,
    })
  }

  const handleRequestTokens = async () => {
    if (!address) return
    setIsRequestingTokens(true)
    try {
      const response = await fetch(
        'https://clearnet-sandbox.yellow.com/faucet/requestTokens',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress: address }),
        }
      )

      response.ok
        ? alert('Tokens requested successfully!')
        : alert('Failed to request tokens.')
    } catch (error) {
      console.error(error)
      alert('Error requesting tokens.')
    } finally {
      setIsRequestingTokens(false)
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-2">
          <div className="text-sm font-extrabold">Tipping</div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div className="grid gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Stream ID" value={streamerInfo?.id || ""} placeholder="-" readOnly />
          <Field label="Amount" value={amount} onChange={setAmount} placeholder="1" />
        </div>

        <Field
          label="Streamer Address"
          value={streamerInfo?.streamer?.address || ""}
          placeholder="0x..."
          readOnly
        />

        <TokenSelector
          label="Tip Token"
          options={TOKENS}
          value={selectedToken}
          onChange={setSelectedToken}
        />

        <Field label="Memo" value={memo} onChange={setMemo} placeholder="Nice stream!" />

        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="text-xs text-white/60">
            {warningMessage && warningMessage.title}
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={!isConnected || isRequestingTokens}
              onClick={handleRequestTokens}
            >
              {isRequestingTokens ? 'Requesting…' : 'Request Tokens'}
            </Button>
            {needAuthVerify ? (
              <Button
                  disabled={!sendTipButtonEnabled}
                  onClick={() => handleAuthVerify()}
              >
                  Auth Verify
              </Button>
            ) : (
              <Button
                  disabled={!sendTipButtonEnabled}
                  onClick={() => handleSendTip()}
              >
                  Send Tip
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
