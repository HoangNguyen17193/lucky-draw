"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { roninMainnet } from "@/lib/viem";
import { LUCKY_DRAW_MANAGER_ABI, ERC20_ABI } from "@/lib/contracts/abi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useCallback } from "react";

const contractAddress = getContractAddress(roninMainnet.id, "luckyDrawManager")!;

export function useContractWrite() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const getWalletClient = useCallback(async () => {
    if (!authenticated || wallets.length === 0) {
      throw new Error("Not connected");
    }

    const wallet = wallets[0];
    await wallet.switchChain(roninMainnet.id);
    const provider = await wallet.getEthereumProvider();

    return createWalletClient({
      chain: roninMainnet,
      transport: custom(provider),
      account: wallet.address as `0x${string}`,
    });
  }, [authenticated, wallets]);

  // User function - enter and get VRF
  const enterDraw = useCallback(
    async (drawId: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "enter",
        args: [drawId],
      });
      return hash;
    },
    [getWalletClient]
  );

  const approveToken = useCallback(
    async (tokenAddress: `0x${string}`, amount: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, amount],
      });
      return hash;
    },
    [getWalletClient]
  );

  // Admin functions
  const createDraw = useCallback(
    async (tokenAddress: `0x${string}`) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "createDraw",
        args: [tokenAddress],
      });
      return hash;
    },
    [getWalletClient]
  );

  const setTiers = useCallback(
    async (
      drawId: bigint,
      tiers: { prizeAmount: bigint; winProbability: bigint }[]
    ) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "setTiers",
        args: [drawId, tiers],
      });
      return hash;
    },
    [getWalletClient]
  );

  const setDefaultPrize = useCallback(
    async (drawId: bigint, amount: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "setDefaultPrize",
        args: [drawId, amount],
      });
      return hash;
    },
    [getWalletClient]
  );

  const setWhitelistBatch = useCallback(
    async (addresses: `0x${string}`[], allowed: boolean) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "setWhitelistBatch",
        args: [addresses, allowed],
      });
      return hash;
    },
    [getWalletClient]
  );

  const fundDraw = useCallback(
    async (drawId: bigint, amount: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "fundDraw",
        args: [drawId, amount],
      });
      return hash;
    },
    [getWalletClient]
  );

  const closeDraw = useCallback(
    async (drawId: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "closeDraw",
        args: [drawId],
      });
      return hash;
    },
    [getWalletClient]
  );

  const withdrawLeftover = useCallback(
    async (drawId: bigint, recipient: `0x${string}`) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "withdrawLeftover",
        args: [drawId, recipient],
      });
      return hash;
    },
    [getWalletClient]
  );

  const cancelDraw = useCallback(
    async (drawId: bigint) => {
      const client = await getWalletClient();
      const hash = await client.writeContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "cancelDraw",
        args: [drawId],
      });
      return hash;
    },
    [getWalletClient]
  );

  return {
    enterDraw,
    approveToken,
    createDraw,
    setTiers,
    setDefaultPrize,
    setWhitelistBatch,
    fundDraw,
    closeDraw,
    withdrawLeftover,
    cancelDraw,
  };
}
