import { createPublicClient, http, defineChain } from "viem";

export const roninSaigon = defineChain({
  id: 2021,
  name: "Ronin Saigon Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "RON",
    symbol: "RON",
  },
  rpcUrls: {
    default: {
      http: ["https://saigon-testnet.roninchain.com/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Saigon Explorer",
      url: "https://saigon-app.roninchain.com",
    },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: roninSaigon,
  transport: http(),
});

export const CHAIN = roninSaigon;
