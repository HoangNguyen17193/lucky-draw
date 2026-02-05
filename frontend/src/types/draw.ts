export enum DrawStatus {
  Open = 0,
  Closed = 1,
  Cancelled = 2,
}

export const DrawStatusLabels: Record<DrawStatus, string> = {
  [DrawStatus.Open]: "Open",
  [DrawStatus.Closed]: "Closed",
  [DrawStatus.Cancelled]: "Cancelled",
};

export interface Tier {
  prizeAmount: bigint;
  winProbability: bigint;
  winnersCount: bigint;
  totalPaid: bigint;
}

export interface Draw {
  status: DrawStatus;
  token: `0x${string}`;
  fundedAmount: bigint;
  totalDistributed: bigint;
  entrantCount: bigint;
  tierCount: bigint;
  defaultPrize: bigint;
}

export interface UserResult {
  hasEntered: boolean;
  hasResult: boolean;
  tierIndex: bigint;
  prizeAmount: bigint;
}

export interface TierDisplay {
  index: number;
  prizeAmount: string;
  winProbability: number;
  color: string;
  label: string;
}

export interface WheelSegment {
  label: string;
  prizeAmount: string;
  color: string;
  tierIndex: number | null;
}

export const TIER_COLORS = {
  jackpot: {
    primary: "#FFD700",
    secondary: "#FFA500",
    glow: "#FFD700",
  },
  tier2: {
    primary: "#E040FB",
    secondary: "#7C4DFF",
    glow: "#E040FB",
  },
  tier3: {
    primary: "#00BCD4",
    secondary: "#2196F3",
    glow: "#00BCD4",
  },
  default: {
    primary: "#4CAF50",
    secondary: "#8BC34A",
    glow: "#4CAF50",
  },
};
