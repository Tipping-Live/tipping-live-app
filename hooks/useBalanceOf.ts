import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { config as wagmiConfig } from "@/app/providers";
import { erc20Abi } from "viem";
import { useState } from "react";

export const useBalanceOf = (
  tokenAddr: `0x${string}` | undefined,
  address: `0x${string}` | undefined,
  chainId?: number | undefined,
) => {
  const [refetchInterval, setRefetchInterval] = useState(0);
  const [intervalTimeout, setIntervalTimeout] = useState(0);

  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["balanceOf", tokenAddr, address, chainId],
    queryFn: () => getBalanceOf(tokenAddr, address, chainId),
    enabled: !!tokenAddr && !!address,
    refetchInterval,
  });

  const pulling = (interval: number, times: number) => {
    if (intervalTimeout) clearInterval(intervalTimeout);
  
    setRefetchInterval(interval);

    const timeout: any = setTimeout(() => {
      setRefetchInterval(0);
    }, interval * times);

    setIntervalTimeout(timeout);
  };

  return { balance, isLoadingBalance, refetchBalance, pulling };
};
const getBalanceOf = async (
  tokenAddr: `0x${string}` | undefined,
  address: `0x${string}` | undefined,
  chainId?: number | undefined,
) => {
  if (!tokenAddr) return BigInt(0);
  if (!address) return BigInt(0);

  if (!chainId) {
    const balance = (await readContract(wagmiConfig, {
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })) as bigint;
    return balance;
  } else {
    const validChain = wagmiConfig.chains.find((chain) => chain.id === chainId);
    if (!validChain) return BigInt(0);
    const balance = (await readContract(wagmiConfig, {
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
      chainId: validChain.id,
    })) as bigint;
    return balance;
  }
};
