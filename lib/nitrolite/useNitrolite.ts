"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { PublicClient, WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// nitrolite sdk
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createCreateChannelMessage,
  createResizeChannelMessage,
  createTransferMessage,
  createCloseChannelMessage,
  createEIP712AuthMessageSigner,
  createAuthVerifyMessageFromChallenge,
  parseBalanceUpdateResponse,
  BalanceUpdateResponse,
  NitroliteClient,
  WalletStateSigner,
  parseAnyRPCResponse,
  createGetChannelsMessage,
  createGetChannelsMessageV2,
  createGetAssetsMessageV2,
  RPCBalance,
  createECDSAMessageSigner,
  RPCMethod,
  RPCAsset,
  CreateChannelResponse,
} from "@erc7824/nitrolite";

import {
  ADJUDICATOR_CONTRACT,
  CHAIN_ID,
  CLEARNODE_WS,
  CUSTODY_CONTRACT,
} from "./config";
import type { NitroliteStatus, WsInbound, WsOutbound } from "./types";

function safeJsonParse(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function useNitrolite() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const wsRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<NitroliteStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [sessionKey, setSessionKey] = useState<`0x${string}` | null>(null);
  const [authParams, setAuthParams] = useState<{
    session_key: `0x${string}`;
    allowances: Array<{ asset: string; amount: string }>;
    expires_at: bigint;
    scope: string;
  } | null>(null);
  const [sessionPrivateKey, setSessionPrivateKey] = useState<
    `0x${string}` | null
  >(null);
  const [ytestUsdBalance, setYtestUsdBalance] = useState<string | null>(null);
  const [ytestUsdToken, setYtestUsdToken] = useState<`0x${string}` | null>(
    null,
  );
  const [channelData, setChannelData] = useState<{
    channel: any;
    unsignedInitialState: any;
    serverSignature: any;
    channelId: `0x${string}`;
  } | null>(null);
  const [resizeData, setResizeData] = useState<{
    resizeState: any;
    proofStates: any;
  } | null>(null);
  const [transferData, setTransferData] = useState<{
    destination: `0x${string}`;
    allocations: Array<{ asset: string; amount: string }>;
  } | null>(null);

  const canWork = Boolean(
    isConnected && address && walletClient && publicClient,
  );

  const nitroliteDeps = useMemo(() => {
    if (
      !walletClient ||
      !publicClient ||
      !walletClient.account ||
      !walletClient.chain
    )
      return null;
    const wc = walletClient as any; // 忽略類型檢查
    const config = {
      publicClient: publicClient as PublicClient,
      walletClient: wc,
      stateSigner: new WalletStateSigner(wc),
      addresses: {
        custody: CUSTODY_CONTRACT,
        adjudicator: ADJUDICATOR_CONTRACT,
      },
      chainId: CHAIN_ID,
      challengeDuration: 3600n, // 1 hour minimum
    };
    return {
      publicClient: publicClient as PublicClient,
      walletClient: wc,
      stateSigner: new WalletStateSigner(wc),
      client: new NitroliteClient(config as any),
      addresses: {
        custody: CUSTODY_CONTRACT,
        adjudicator: ADJUDICATOR_CONTRACT,
      },
      chainId: CHAIN_ID,
    };
  }, [walletClient, publicClient]);

  const send = useCallback((msg: WsOutbound) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN)
      throw new Error("WebSocket is not open");
    ws.send(JSON.stringify(msg));
  }, []);

  const connectWs = useCallback(() => {
    if (!canWork) throw new Error("Wallet not ready");

    // 總是關閉現有連接並重置狀態
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("ws_connecting");
    setLastError(null);

    const ws = new WebSocket(CLEARNODE_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to Yellow Network!");
      setStatus("ws_connected");
    };

    ws.onerror = (error) => {
      console.error("Connection error:", error);

      setStatus("error");
      setLastError("WebSocket error");
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("idle");
    };

    ws.onmessage = (evt) => {
      try {
        const rpcResponse = parseAnyRPCResponse(String(evt.data));
        console.log("Parsed RPC Response:", rpcResponse);

        // 一開始連線會取得資產列表，找出 ytest.usd 的 token address 並存起來
        if (rpcResponse.method === RPCMethod.Assets) {
          const assets: RPCAsset[] = rpcResponse.params.assets;

          // 找出 ytest.usd: chainId=11155111 或 59141, symbol=ytest.usd, decimals=6
          const ytestAsset = assets.find(
            (asset) =>
              (asset.chainId === 11155111 || asset.chainId === 59141) &&
              asset.symbol === "ytest.usd" &&
              asset.decimals === 6,
          );

          if (ytestAsset) {
            setYtestUsdToken(ytestAsset.token as `0x${string}`);
            console.log("Found ytest.usd token:", ytestAsset.token);
          } else {
            console.warn("ytest.usd asset not found in assets response");
          }

          console.log("Received assets response:", rpcResponse.params);
          return;
        }

        if (rpcResponse.method === RPCMethod.AuthChallenge) {
          console.log("Received auth challenge:", rpcResponse.params);
          const challengeMessage = rpcResponse.params.challengeMessage;
          console.log("Challenge message for signing:", challengeMessage);
          setChallenge(challengeMessage);
          setStatus("auth_challenged");
          return;
        }

        // 處理特定訊息
        if (rpcResponse.method === RPCMethod.BalanceUpdate) {
          let data: BalanceUpdateResponse = parseBalanceUpdateResponse(
            evt.data,
          );
          console.log("Balance update data:", data.params.balanceUpdates);
          const balanceUpdates: RPCBalance[] = data.params.balanceUpdates;
          // 找出 ytest.usd
          const ytestUpdate = balanceUpdates.find(
            (update) => update.asset === "ytest.usd",
          );
          if (ytestUpdate) {
            setYtestUsdBalance(ytestUpdate.amount);
          }
          // 可以添加狀態來存儲 balance updates
        }

        if (rpcResponse.method === RPCMethod.CreateChannel) {
          console.log("CreateChannel response:", rpcResponse.params);
          const { channel, state, serverSignature, channelId } =
            rpcResponse.params as CreateChannelResponse["params"];
          // unsignedInitialState 從 state 中提取
          setChannelData({
            channel,
            unsignedInitialState: {
              intent: state.intent,
              version: state.version,
              data: state.stateData,
              allocations: state.allocations,
            },
            serverSignature,
            channelId: channelId as `0x${string}`,
          });
          setStatus("channel_created");
        }

        if (rpcResponse.method === RPCMethod.GetChannels) {
          console.log("GetChannels response:", rpcResponse.params);
          // 可以在這裡處理頻道列表，例如存到狀態中
        }

        if (rpcResponse.method === RPCMethod.ResizeChannel) {
          console.log("ResizeChannel response:", rpcResponse.params);
          const { resizeState, proofStates } = rpcResponse.params as any;
          setResizeData({ resizeState, proofStates });
          setStatus("channel_resized");
        }

        if (rpcResponse.method === RPCMethod.Transfer) {
          console.log("Transfer response:", rpcResponse.params);
          // 假設響應包含成功信息
          setStatus("transferred");
        }

        if (rpcResponse.method === RPCMethod.Error) {
          console.error("RPC Error:", rpcResponse.params?.error);
          setStatus("error");
          setLastError(rpcResponse.params?.error || "RPC error");
          return;
        }

        return;
      } catch (error) {
        console.error("Failed to parse RPC response:", error);
        setLastError("Invalid RPC response format");
        return;
      }
    };
  }, [canWork]);

  const disconnectWs = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
    setChallenge(null);
    setSessionKey(null);
    setAuthParams(null);
    setLastError(null);
  }, []);

  // 自訂 auth request
  const sendAuthRequest = useCallback(
    async (params: {
      application: string;
      allowances: Array<{ asset: string; amount: string }>;
      expires_at: bigint;
      scope: string;
    }) => {
      if (!canWork || !address || !walletClient)
        throw new Error("Wallet not ready");
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        throw new Error("WS not connected");

      // 生成臨時 session key
      const sessionPrivateKeyTemp = generatePrivateKey();
      const sessionSignerTemp = createECDSAMessageSigner(sessionPrivateKeyTemp);
      const sessionAccount = privateKeyToAccount(sessionPrivateKeyTemp);

      const authRequestMsg = await createAuthRequestMessage({
        address: address as `0x${string}`,
        application: params.application,
        session_key: sessionAccount.address,
        allowances: params.allowances,
        expires_at: params.expires_at,
        scope: params.scope,
      });

      setStatus("auth_requested");
      setSessionKey(sessionAccount.address);
      setSessionPrivateKey(sessionPrivateKeyTemp);
      setAuthParams({
        session_key: sessionAccount.address,
        allowances: params.allowances,
        expires_at: params.expires_at,
        scope: params.scope,
      });
      wsRef.current.send(authRequestMsg);
    },
    [address, canWork, walletClient],
  );

  // 2) Verify auth (EIP-712 sign challenge)
  const verifyAuth = useCallback(async () => {
    if (!canWork || !address || !walletClient || !nitroliteDeps)
      throw new Error("Wallet not ready");
    if (!challenge || !authParams)
      throw new Error("No challenge or auth params");

    const signer = createEIP712AuthMessageSigner(walletClient, authParams, {
      name: "Test app",
    });
    const verifyMsg = await createAuthVerifyMessageFromChallenge(
      signer,
      challenge,
    );

    wsRef.current!.send(verifyMsg);
    setStatus("auth_verified");
  }, [address, canWork, challenge, nitroliteDeps, authParams, walletClient]);

  // 3) Send tip (先做示範 payload)
  const sendTip = useCallback(
    async (params: {
      streamId: string;
      streamer: `0x${string}`;
      token: `0x${string}`; // ERC20 address or pseudo for native
      amount: string; // decimal string (你可換成 bigint/wei)
      memo?: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        throw new Error("WS not connected");
      if (!address) throw new Error("No wallet");

      // 先用自訂 method：你之後替換成 nitrolite 的 transfer/payment message builder
      const msg: WsOutbound = {
        method: "tip_request",
        params: {
          from: address,
          to: params.streamer,
          streamId: params.streamId,
          token: params.token,
          amount: params.amount,
          memo: params.memo || "",
          ts: Date.now(),
        },
      };

      send(msg);
    },
    [address, send],
  );

  // 3) Create channel
  const createChannel = useCallback(async () => {
    if (
      !sessionPrivateKey ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      throw new Error("Session not ready");

    // 使用 ytest.usd token，如果沒有則使用原生 ETH
    const tokenToUse =
      ytestUsdToken || "0x0000000000000000000000000000000000000000";

    // 創建 message signer
    const messageSigner = createECDSAMessageSigner(sessionPrivateKey);

    const createChannelMsg = await createCreateChannelMessage(messageSigner, {
      chain_id: 11155111, // Sepolia
      token: tokenToUse,
    });

    wsRef.current.send(createChannelMsg);
    setStatus("channel_creating");
  }, [sessionPrivateKey, ytestUsdToken]);

  // Resize channel
  const resizeChannel = useCallback(
    async (params: {
      channelId: string;
      allocateAmount: bigint;
      fundsDestination: `0x${string}`;
    }) => {
      if (
        !sessionPrivateKey ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      )
        throw new Error("Session not ready");

      const messageSigner = createECDSAMessageSigner(sessionPrivateKey);

      const resizeMsg = await createResizeChannelMessage(messageSigner, {
        channel_id: params.channelId as `0x${string}`,
        allocate_amount: params.allocateAmount,
        funds_destination: params.fundsDestination,
      });

      wsRef.current.send(resizeMsg);
      setStatus("channel_resizing");
    },
    [sessionPrivateKey],
  );

  // Submit channel to chain
  const submitChannel = useCallback(async () => {
    if (!channelData || !nitroliteDeps) throw new Error("No channel data");

    const createResult = await nitroliteDeps.client.createChannel({
      channel: channelData.channel,
      unsignedInitialState: channelData.unsignedInitialState,
      serverSignature: channelData.serverSignature,
    });

    console.log("Channel submitted to chain:", createResult);
    setStatus("channel_submitted");
  }, [channelData, nitroliteDeps]);

  // Submit resize to chain
  const submitResize = useCallback(async () => {
    if (!resizeData || !nitroliteDeps) throw new Error("No resize data");

    await nitroliteDeps.client.resizeChannel(resizeData);

    console.log("Resize submitted to chain");
    setStatus("resize_submitted");
  }, [resizeData, nitroliteDeps]);

  // Create transfer
  const createTransfer = useCallback(
    async (params: {
      destination: `0x${string}`;
      allocations: Array<{ asset: string; amount: string }>;
    }) => {
      if (
        !sessionPrivateKey ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      )
        throw new Error("Session not ready");

      const messageSigner = createECDSAMessageSigner(sessionPrivateKey);

      const transferMsg = await createTransferMessage(
        messageSigner,
        {
          destination: params.destination,
          allocations: params.allocations,
        },
        Date.now(),
      );

      setTransferData(params);
      wsRef.current.send(transferMsg);
      setStatus("transferring");
    },
    [sessionPrivateKey],
  );

  // Close channel
  const closeChannel = useCallback(
    async (channelId: `0x${string}`, fundsDestination: `0x${string}`) => {
      if (
        !sessionPrivateKey ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      )
        throw new Error("Session not ready");

      const messageSigner = createECDSAMessageSigner(sessionPrivateKey);

      const closeMsg = await createCloseChannelMessage(
        messageSigner,
        channelId,
        fundsDestination,
      );

      wsRef.current.send(closeMsg);
      console.log("Channel close message sent");
    },
    [sessionPrivateKey],
  );

  // Get channels
  const getChannels = useCallback(
    async (participant?: `0x${string}`, status?: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        throw new Error("WS not connected");
      const msg = createGetChannelsMessageV2(participant || address, status);
      wsRef.current.send(msg);
    },
    [address],
  );

  const getChannelData = useCallback(
    async (channelId: `0x${string}`) => {
      if (!nitroliteDeps) throw new Error("Nitrolite client not ready");
      return await nitroliteDeps.client.getChannelData(channelId);
    },
    [nitroliteDeps],
  );

  // Get assets
  const getAssets = useCallback(async (chainId?: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      throw new Error("WS not connected");

    const msg = createGetAssetsMessageV2(chainId || 11155111);
    console.log("Get Assets Message:", msg);
    wsRef.current.send(msg);
  }, []);

  // 自動清理
  useEffect(() => {
    return () => disconnectWs();
  }, [disconnectWs]);

  return {
    canWork,
    status,
    lastError,
    sessionKey,
    challenge,
    authParams,
    ytestUsdBalance,
    ytestUsdToken,
    channelId: channelData?.channelId || null,

    connectWs,
    disconnectWs,
    sendAuthRequest,
    verifyAuth,
    createChannel,
    submitChannel,
    resizeChannel,
    submitResize,
    createTransfer,
    closeChannel,
    getChannels,
    getAssets,

    sendTip,
  };
}
