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

import { handleResizeChannel } from "./handleResizeChannel";

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
  const [channels, setChannels] = useState<any[]>([]);
  const [closeData, setCloseData] = useState<{
    finalState: any;
    stateData: any;
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

    console.log("🔌 Starting WebSocket connection...");
    console.log("WebSocket URL:", CLEARNODE_WS);
    console.log("CLEARNODE_WS defined:", typeof CLEARNODE_WS, CLEARNODE_WS);
    console.log("Current status:", status);

    // 總是關閉現有連接並重置狀態
    if (wsRef.current) {
      console.log("Closing existing WebSocket connection");
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("ws_connecting");
    setLastError(null);

    try {
      const ws = new WebSocket(CLEARNODE_WS);
      console.log("WebSocket instance created:", !!ws);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to Yellow Network!");
        console.log("WebSocket readyState:", ws.readyState);
        console.log("wsRef.current is set:", !!wsRef.current);
        setStatus("ws_connected");
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket connection error:", error);
        console.log("WebSocket readyState on error:", ws.readyState);
        console.log("Error details:", error);
        setStatus("error");
        setLastError("WebSocket connection failed");
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        console.log("wsRef.current before null:", !!wsRef.current);
        wsRef.current = null;
        setStatus("idle");
      };

      // 添加連接超時檢查
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log("⏰ WebSocket connection timeout");
          ws.close();
          setStatus("error");
          setLastError("WebSocket connection timeout");
        }
      }, 10000); // 10秒超時

      ws.onmessage = async (evt) => {
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
            const channelsList = rpcResponse.params.channels || [];
            setChannels(channelsList);
            console.log("Stored channels:", channelsList);
          }

          if (rpcResponse.method === RPCMethod.ResizeChannel) {
            console.log("ResizeChannel response:", rpcResponse.params);
            // Assuming params has channel_id, state, server_signature
            const params = rpcResponse.params as any;
            if (nitroliteDeps && sessionPrivateKey && wsRef.current && address) {
              const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);
              handleResizeChannel(
                params,
                nitroliteDeps.client,
                nitroliteDeps.publicClient,
                sessionSigner,
                wsRef.current,
                { address: address as `0x${string}` },
              ).catch((error) => {
                console.error("Error handling resize channel:", error);
                setStatus("error");
                setLastError("Resize channel handling failed");
              });
            } else {
              // Fallback to simple handling
              const { resizeState, proofStates } = params;
              setResizeData({ resizeState, proofStates });
              setStatus("channel_resized");
            }
          }

          if (rpcResponse.method === RPCMethod.Transfer) {
            console.log("Transfer response:", rpcResponse.params);
            // 假設響應包含成功信息
            setStatus("transferred");
          }

          if (rpcResponse.method === RPCMethod.CloseChannel) {
            console.log("CloseChannel response:", rpcResponse.params);
            const { channelId, state, serverSignature } = rpcResponse.params;
            console.log(`✓ Node signed close for ${channelId}`);
            const finalState = {
              intent: state.intent,
              version: BigInt(state.version),
              data: state.stateData,
              allocations: state.allocations.map((a: any) => ({
                destination: a.destination,
                token: a.token,
                amount: BigInt(a.amount),
              })),
              channelId: channelId,
              serverSignature: serverSignature,
            };
            try {
              console.log(`  Submitting close to L1 for ${channelId}...`);

              if (!nitroliteDeps) {
                console.error(
                  "Nitrolite client not available for closing channel",
                );
                return;
              }

              const txHash = await nitroliteDeps.client.closeChannel({
                finalState,
                stateData: finalState.data,
              });
              console.log(`✓ Closed on-chain: ${txHash}`);
            } catch (e) {
              // If it fails (e.g. already closed or race condition), just log and continue
              console.error(`Failed to close ${channelId} on-chain:`, e);
            }
            setStatus("channel_closed");
          }

          if (rpcResponse.method === RPCMethod.Error) {
            const errorMsg = rpcResponse.params?.error || "RPC error";
            console.error("RPC Error:", errorMsg);

            // Check if it's a resize already ongoing error
            const resizeOngoingMatch = errorMsg.match(
              /resize already ongoing.*channel (0x[a-fA-F0-9]+)/,
            );
            if (resizeOngoingMatch) {
              const channelId = resizeOngoingMatch[1] as `0x${string}`;
              console.log(
                `Detected ongoing resize for channel ${channelId}, attempting to complete...`,
              );
              checkAndCompletePendingResize(channelId).catch((err) => {
                console.error("Failed to complete pending resize:", err);
              });
            }

            setStatus("error");
            setLastError(errorMsg);
            return;
          }

          return;
        } catch (error) {
          console.error("Failed to parse RPC response:", error);
          setLastError("Invalid RPC response format");
          return;
        }
      };

    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      setStatus("error");
      setLastError("Failed to create WebSocket connection");
    }
  }, [canWork, status]);

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

  // Resize channel 送出 resize 請求給 server，server 會回新的 state 和 proof，然後你要簽名並送出 confirm message
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

  // Submit close to chain
  const submitClose = useCallback(async () => {
    if (!closeData || !nitroliteDeps) throw new Error("No close data");

    await nitroliteDeps.client.closeChannel(closeData);

    console.log("Close submitted to chain");
    setStatus("close_submitted");
  }, [closeData, nitroliteDeps]);

  // Withdraw from Custody Contract to Wallet
  const withdrawFunds = useCallback(
    async (tokenAddress: `0x${string}`, withdrawableBalance: bigint) => {
      if (!nitroliteDeps) throw new Error("Client not ready");

      const withdrawalTx = await nitroliteDeps.client.withdrawal(
        tokenAddress,
        withdrawableBalance,
      );
      console.log("Funds withdrawn:", withdrawalTx);
      setStatus("withdrawn");
    },
    [nitroliteDeps],
  );

  // Get channels
  const sendGetChannelsMsgToWS = useCallback(
    async (participant?: `0x${string}`, status?: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        throw new Error("WS not connected");
      const msg = createGetChannelsMessageV2(participant || address, status);

      if (nitroliteDeps) {
        const openChannelsL1 = await nitroliteDeps.client.getOpenChannels();
        console.log("Open channels from chain:", openChannelsL1);
      }
      wsRef.current.send(msg);
    },
    [address, nitroliteDeps],
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

  // Check and complete pending resize for a specific channel
  const checkAndCompletePendingResize = useCallback(
    async (channelId: `0x${string}`) => {
      if (!nitroliteDeps) throw new Error("Nitrolite client not ready");

      try {
        console.log(`Checking for pending resize data...`);

        // If we have resizeData from a previous response, try to submit it
        if (resizeData) {
          console.log("Found existing resizeData, attempting to submit...");
          await nitroliteDeps.client.resizeChannel(resizeData);
          console.log("✓ Pending resize submitted to chain");
          setStatus("resize_submitted");
          setResizeData(null); // Clear after submission
        } else {
          console.log(
            "No pending resize data found. You may need to initiate a new resize.",
          );
        }
      } catch (error) {
        console.error("Error submitting pending resize:", error);
        setStatus("error");
        setLastError("Failed to submit pending resize");
      }
    },
    [nitroliteDeps, resizeData],
  );

  ///////////// Client API Wrappers /////////////

  // Submit close to chain
  // const submitClose = useCallback(async () => {
  //   if (!closeData || !nitroliteDeps) throw new Error("No close data");

  //   await nitroliteDeps.client.closeChannel(closeData);

  //   console.log("Close submitted to chain");
  //   setStatus("close_submitted");
  // }, [closeData, nitroliteDeps]);

  ///////////// Send To WS 的 API /////////////
  // Close channel
  const sendCloseChannelMsgToWS = useCallback(
    async (channelId: `0x${string}`, participantAddress?: `0x${string}`) => {
      console.log("sendCloseChannelMsgToWS called with:", {
        sessionPrivateKey: !!sessionPrivateKey,
        wsRef: !!wsRef.current,
        wsReadyState: wsRef.current?.readyState,
        address: !!address,
        status,
      });

      if (
        !sessionPrivateKey ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !address
      )
        throw new Error(
          `Session not ready. Status: ${status}, WS ReadyState: ${wsRef.current?.readyState}`,
        );

      const messageSigner = createECDSAMessageSigner(sessionPrivateKey);

      const closeMsg = await createCloseChannelMessage(
        messageSigner,
        channelId,
        participantAddress || (address as `0x${string}`),
      );

      wsRef.current.send(closeMsg);
      console.log("Channel close message sent");
      setStatus("channel_closing");
    },
    [sessionPrivateKey, address],
  );

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
    channels,

    connectWs,
    disconnectWs,
    sendAuthRequest,
    verifyAuth,
    createChannel,
    submitChannel,
    resizeChannel,
    submitResize,
    createTransfer,
    sendCloseChannelMsgToWS,
    submitClose,
    withdrawFunds,
    getChannels: sendGetChannelsMsgToWS,
    getChannelData,
    getAssets,
    checkAndCompletePendingResize,

    sendTip,
  };
}
