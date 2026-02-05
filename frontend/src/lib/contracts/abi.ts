export const LUCKY_DRAW_MANAGER_ABI = [
  // User functions
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "enter",
    outputs: [{ name: "requestId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "getDraw",
    outputs: [
      { name: "status", type: "uint8" },
      { name: "token", type: "address" },
      { name: "fundedAmount", type: "uint256" },
      { name: "totalDistributed", type: "uint256" },
      { name: "entrantCount", type: "uint256" },
      { name: "tierCount", type: "uint256" },
      { name: "defaultPrize", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "tierIndex", type: "uint256" },
    ],
    name: "getTier",
    outputs: [
      { name: "prizeAmount", type: "uint256" },
      { name: "winProbability", type: "uint256" },
      { name: "winnersCount", type: "uint256" },
      { name: "totalPaid", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "getTierCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getUserResult",
    outputs: [
      { name: "hasEntered", type: "bool" },
      { name: "hasResult", type: "bool" },
      { name: "tierIndex", type: "uint256" },
      { name: "prizeAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "whitelist",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextDrawId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "getTotalTierProbability",
    outputs: [{ name: "total", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "getAvailableFunds",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Admin functions
  {
    inputs: [{ name: "token", type: "address" }],
    name: "createDraw",
    outputs: [{ name: "drawId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      {
        components: [
          { name: "prizeAmount", type: "uint256" },
          { name: "winProbability", type: "uint256" },
        ],
        name: "tierInputs",
        type: "tuple[]",
      },
    ],
    name: "setTiers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "setDefaultPrize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "users", type: "address[]" },
      { name: "allowed", type: "bool" },
    ],
    name: "setWhitelistBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    name: "setWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "fundDraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "closeDraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    name: "withdrawLeftover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "drawId", type: "uint256" }],
    name: "cancelDraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "drawId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "requestId", type: "uint256" },
    ],
    name: "EntryRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "drawId", type: "uint256" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "tierIndex", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PrizeAwarded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "drawId", type: "uint256" }],
    name: "DrawClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "drawId", type: "uint256" }],
    name: "DrawCancelled",
    type: "event",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
