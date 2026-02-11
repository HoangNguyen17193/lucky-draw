"use client";

import { useQuery } from "@tanstack/react-query";
import { publicClient, roninMainnet } from "@/lib/viem";
import { LUCKY_DRAW_MANAGER_ABI } from "@/lib/contracts/abi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { Draw, DrawStatus, Tier, UserResult } from "@/types/draw";
import { parseAbiItem } from "viem";

const contractAddress = getContractAddress(roninMainnet.id, "luckyDrawManager")!;

export function useDraw(drawId: bigint) {
  return useQuery({
    queryKey: ["draw", drawId.toString()],
    queryFn: async (): Promise<Draw> => {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "getDraw",
        args: [drawId],
      });

      return {
        status: result[0] as DrawStatus,
        token: result[1],
        fundedAmount: result[2],
        totalDistributed: result[3],
        entrantCount: result[4],
        tierCount: result[5],
        defaultPrize: result[6],
      };
    },
    refetchInterval: 10000,
  });
}

export function useTiers(drawId: bigint, tierCount: bigint) {
  return useQuery({
    queryKey: ["tiers", drawId.toString(), tierCount.toString()],
    queryFn: async (): Promise<Tier[]> => {
      const tiers: Tier[] = [];
      for (let i = 0n; i < tierCount; i++) {
        const result = await publicClient.readContract({
          address: contractAddress,
          abi: LUCKY_DRAW_MANAGER_ABI,
          functionName: "getTier",
          args: [drawId, i],
        });
        tiers.push({
          prizeAmount: result[0],
          winProbability: result[1],
          winnersCount: result[2],
          totalPaid: result[3],
        });
      }
      return tiers;
    },
    enabled: tierCount > 0n,
  });
}

export function useUserResult(drawId: bigint, address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ["userResult", drawId.toString(), address],
    queryFn: async (): Promise<UserResult> => {
      if (!address) {
        return { hasEntered: false, hasResult: false, tierIndex: 0n, prizeAmount: 0n };
      }
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "getUserResult",
        args: [drawId, address],
      });
      return {
        hasEntered: result[0],
        hasResult: result[1],
        tierIndex: result[2],
        prizeAmount: result[3],
      };
    },
    enabled: !!address,
    refetchInterval: 3000, // Poll frequently while waiting for VRF
  });
}

export function useIsWhitelisted(address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ["whitelist", address],
    queryFn: async (): Promise<boolean> => {
      if (!address) return false;
      return publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "whitelist",
        args: [address],
      });
    },
    enabled: !!address,
  });
}

export function useNextDrawId() {
  return useQuery({
    queryKey: ["nextDrawId"],
    queryFn: async (): Promise<bigint> => {
      return publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "nextDrawId",
      });
    },
  });
}

export function useContractOwner() {
  return useQuery({
    queryKey: ["owner"],
    queryFn: async (): Promise<`0x${string}`> => {
      return publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "owner",
      });
    },
  });
}

export function useAvailableFunds(drawId: bigint) {
  return useQuery({
    queryKey: ["availableFunds", drawId.toString()],
    queryFn: async (): Promise<bigint> => {
      return publicClient.readContract({
        address: contractAddress,
        abi: LUCKY_DRAW_MANAGER_ABI,
        functionName: "getAvailableFunds",
        args: [drawId],
      });
    },
    refetchInterval: 10000,
  });
}

export interface Winner {
  address: `0x${string}`;
  tierIndex: bigint;
  prizeAmount: bigint;
}

export function useWinners(drawId: bigint, entrantCount: bigint) {
  return useQuery({
    queryKey: ["winners", drawId.toString(), entrantCount.toString()],
    queryFn: async (): Promise<Winner[]> => {
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event PrizeAwarded(uint256 indexed drawId, address indexed winner, uint256 tierIndex, uint256 amount)"
        ),
        args: { drawId },
        fromBlock: 0n,
        toBlock: "latest",
      });

      return logs.map((log) => ({
        address: log.args.winner!,
        tierIndex: log.args.tierIndex!,
        prizeAmount: log.args.amount!,
      }));
    },
    enabled: entrantCount > 0n,
    refetchInterval: 15000,
  });
}
