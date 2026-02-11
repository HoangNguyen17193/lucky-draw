import { roninMainnet } from "../viem";

export const CONTRACT_ADDRESSES = {
  [roninMainnet.id]: {
    luckyDrawManager: "0x77dD872aE0691FDBF550D31fEF5cD2bCe4dDD03B" as `0x${string}`,
    usdc: "0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc" as `0x${string}`, // Ronin Mainnet USDC
  },
} as const;

export const SUPPORTED_CHAIN_IDS = [roninMainnet.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function getContractAddress(
  chainId: number,
  contract: keyof (typeof CONTRACT_ADDRESSES)[SupportedChainId]
): `0x${string}` | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.[contract];
}
