import { createPublicClient, http, defineChain } from "viem";

export const roninMainnet = defineChain({
  id: 2020,
  name: "Ronin",
  nativeCurrency: {
    decimals: 18,
    name: "RON",
    symbol: "RON",
  },
  rpcUrls: {
    default: {
      http: ["https://api.roninchain.com/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ronin Explorer",
      url: "https://app.roninchain.com",
    },
  },
  testnet: false,
});

export const publicClient = createPublicClient({
  chain: roninMainnet,
  transport: http(),
});

export const CHAIN = roninMainnet;
