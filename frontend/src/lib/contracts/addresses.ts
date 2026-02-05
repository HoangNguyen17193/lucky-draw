import { roninSaigon } from "../viem";

export const CONTRACT_ADDRESSES = {
  [roninSaigon.id]: {
    luckyDrawManager: "0xa1844a4d7d7e965060682a12A104180bAeE13EA5" as `0x${string}`,
    usdc: "0x067fbff8990c58ab90bae3c97241c5d736053f77" as `0x${string}`, // Ronin Saigon USDC
  },
} as const;

export const SUPPORTED_CHAIN_IDS = [roninSaigon.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function getContractAddress(
  chainId: number,
  contract: keyof (typeof CONTRACT_ADDRESSES)[SupportedChainId]
): `0x${string}` | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.[contract];
}
