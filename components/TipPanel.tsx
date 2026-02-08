"use client";

import { useEffect, useMemo, useState } from "react";
import useStreamInfo from "@/hooks/useStreamerInfo";
import { useSearchParams } from "next/navigation";
import TokenSelector, { TokenOption } from "@/components/ui/TokenSelector";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useNitrolite } from "@/lib/nitrolite/useNitrolite";
import { useAccount } from "wagmi";
import EnsName from "@/components/ui/EnsName";

export default function TipPanel() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState("1");
  const [memo, setMemo] = useState("Stay strong!");
  const [isRequestingTokens, setIsRequestingTokens] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const searchParams = useSearchParams();

  const nitro = useNitrolite();

  const streamIdFromParams = useMemo(() => {
    return searchParams.get("stream_id") ?? "";
  }, [searchParams]);

  const { data: streamerInfo } = useStreamInfo({
    streamId: streamIdFromParams!,
  });

  // Build token options dynamically from ClearNode assets
  const tokenOptions: TokenOption[] = useMemo(() => {
    if (!nitro.assets || nitro.assets.length === 0) return [];
    const seen = new Set<string>();
    return nitro.assets
      .filter(
        (asset) => asset.chainId === 11155111 || asset.chainId === 59141,
      )
      .filter((asset) => {
        if (seen.has(asset.symbol)) return false;
        seen.add(asset.symbol);
        return true;
      })
      .map((asset) => ({
        symbol: asset.symbol,
        address: asset.token as `0x${string}`,
        decimals: asset.decimals,
        enabled: true,
      }));
  }, [nitro.assets]);

  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);

  // Auto-select first token when options become available
  useEffect(() => {
    if (tokenOptions.length > 0 && !selectedToken) {
      setSelectedToken(tokenOptions[0]);
    }
  }, [tokenOptions, selectedToken]);

  // ClearNode balance for ytest.usd
  const balance = nitro.ytestUsdBalance;

  const isInsufficientBalance = useMemo(() => {
    if (!balance || !amount) return false;
    return parseFloat(balance) < parseFloat(amount);
  }, [balance, amount]);

  const isStreamInfoReady = Boolean(
    streamerInfo?.id && streamerInfo?.streamer?.address,
  );

  // --- Auto-flow: same pattern as HostDashboard ---

  // When ws_connected -> auto send auth request
  useEffect(() => {
    if (nitro.status === "ws_connected") {
      nitro
        .sendAuthRequest({
          application: "tipping-live-app",
          allowances: [{ asset: "ytest.usd", amount: "1000" }],
          expires_at: BigInt(Math.floor(Date.now() / 1000) + 86400),
          scope: "console",
        })
        .catch(() => {});
    }
  }, [nitro.status]);

  // When auth_challenged -> auto verify
  useEffect(() => {
    if (nitro.status === "auth_challenged" && nitro.challenge) {
      nitro.verifyAuth().catch(() => {});
    }
  }, [nitro.status, nitro.challenge]);

  // When auth_verified -> auto fetch assets
  useEffect(() => {
    if (nitro.status === "auth_verified") {
      nitro.getAssets().catch(() => {});
    }
  }, [nitro.status]);

  // Reset success feedback after delay
  useEffect(() => {
    if (sendSuccess) {
      const timer = setTimeout(() => setSendSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendSuccess]);

  // Reset sending state when transfer completes or errors
  useEffect(() => {
    if (nitro.status === "transferred") {
      setIsSending(false);
      setSendSuccess(true);
    }
    if (nitro.status === "error") {
      setIsSending(false);
    }
  }, [nitro.status]);

  const handleConnect = () => {
    try {
      nitro.connectWs();
    } catch {
      /* ignore */
    }
  };

  const handleSendTip = async () => {
    if (!streamerInfo?.streamer?.address || !selectedToken || !amount) return;
    setIsSending(true);
    try {
      await nitro.createTransfer({
        destination: streamerInfo.streamer.address as `0x${string}`,
        allocations: [{ asset: selectedToken.symbol, amount }],
      });
    } catch (err) {
      console.error("Transfer failed:", err);
      setIsSending(false);
    }
  };

  const handleRequestTokens = async () => {
    if (!address) return;
    setIsRequestingTokens(true);
    try {
      const response = await fetch(
        "https://clearnet-sandbox.yellow.com/faucet/requestTokens",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address }),
        },
      );

      response.ok
        ? alert("Tokens requested successfully!")
        : alert("Failed to request tokens.");
    } catch (error) {
      console.error(error);
      alert("Error requesting tokens.");
    } finally {
      setIsRequestingTokens(false);
    }
  };

  // Determine what to show based on status
  const isConnecting = [
    "ws_connecting",
    "ws_connected",
    "auth_requested",
    "auth_challenged",
  ].includes(nitro.status);
  const isAuthed = nitro.status === "auth_verified" || nitro.status === "transferred" || nitro.status === "transferring";
  const hasTokens = tokenOptions.length > 0;

  const sendTipButtonEnabled =
    isStreamInfoReady &&
    !!Number(amount) &&
    isAuthed &&
    isConnected &&
    !isInsufficientBalance &&
    !isSending &&
    selectedToken !== null;

  // Warning messages
  const warningMessage = useMemo(() => {
    if (!isConnected) return "Wallet is not connected.";
    if (nitro.status === "error") return nitro.lastError || "Connection error";
    if (isInsufficientBalance && selectedToken)
      return `Insufficient ${selectedToken.symbol} balance to send donation.`;
    return null;
  }, [isConnected, nitro.status, nitro.lastError, isInsufficientBalance, selectedToken]);

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-2">
          <div className="text-sm font-extrabold">Donate</div>
          {balance && (
            <div className="text-xs text-white/60">
              ClearNode Balance: {balance} ytest.usd
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div className="grid gap-4 p-4">
        {/* Not connected to ClearNode: show Connect button */}
        {nitro.status === "idle" && isConnected && (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-white/60">
              Connect to Yellow Network to send donations
            </p>
            <Button onClick={handleConnect} disabled={!nitro.canWork}>
              Connect
            </Button>
          </div>
        )}

        {/* Connecting / authenticating */}
        {isConnecting && (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <span className="text-sm text-white/60">Connecting...</span>
          </div>
        )}

        {/* Authed but no assets yet */}
        {isAuthed && !hasTokens && !isSending && (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <span className="text-sm text-white/60">Loading tokens...</span>
          </div>
        )}

        {/* Success feedback */}
        {sendSuccess && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/25 p-3 text-center text-sm text-green-400">
            Donation sent successfully!
          </div>
        )}

        {/* Tip form: show when authenticated and tokens available */}
        {isAuthed && hasTokens && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Stream ID"
                value={streamerInfo?.id || ""}
                placeholder="-"
                readOnly
              />
              <Field
                label="Amount"
                value={amount}
                onChange={setAmount}
                placeholder="1"
              />
            </div>

            {streamerInfo?.streamer?.address && (
              <div className="text-sm text-muted">
                Sending to:{" "}
                <EnsName
                  address={streamerInfo.streamer.address}
                  displayName={streamerInfo.streamer.name}
                />
              </div>
            )}

            <Field
              label="Recipient Address"
              value={streamerInfo?.streamer?.address || ""}
              placeholder="0x..."
              readOnly
            />

            {selectedToken && (
              <TokenSelector
                label="Token"
                options={tokenOptions}
                value={selectedToken}
                onChange={setSelectedToken}
              />
            )}

            <Field
              label="Memo"
              value={memo}
              onChange={setMemo}
              placeholder="Leave a message of support"
            />

            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div className="text-xs text-white/60">
                {warningMessage}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  disabled={!isConnected || isRequestingTokens}
                  onClick={handleRequestTokens}
                >
                  {isRequestingTokens ? "Requesting..." : "Request Tokens"}
                </Button>
                <Button
                  disabled={!sendTipButtonEnabled}
                  onClick={handleSendTip}
                >
                  {isSending ? "Sending..." : "Send Donation"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Error state with retry */}
        {nitro.status === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-red-400">
              {nitro.lastError || "Connection error"}
            </p>
            <Button onClick={handleConnect}>Retry</Button>
          </div>
        )}

        {/* Wallet not connected */}
        {!isConnected && (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-white/60">
              Connect your wallet to send donations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
