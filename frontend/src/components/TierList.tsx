"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Award, Gift } from "lucide-react";
import { Tier } from "@/types/draw";
import { formatUnits } from "viem";

interface TierListProps {
  tiers: Tier[];
  defaultPrize: bigint;
  decimals?: number;
  symbol?: string;
}

const TIER_ICONS = [Trophy, Star, Award, Gift];
const TIER_NAMES = ["Jackpot", "Tier 2", "Tier 3", "Tier 4"];

export function TierList({
  tiers,
  defaultPrize,
  decimals = 6,
  symbol = "USDC",
}: TierListProps) {
  const getTierStyle = (index: number) => {
    const styles = [
      { bg: "from-[#FFD700]/20 to-[#FFA500]/10", border: "#FFD700", text: "#FFD700" },
      { bg: "from-[#E040FB]/20 to-[#7C4DFF]/10", border: "#E040FB", text: "#E040FB" },
      { bg: "from-[#00BCD4]/20 to-[#2196F3]/10", border: "#00BCD4", text: "#00BCD4" },
      { bg: "from-[#4CAF50]/20 to-[#8BC34A]/10", border: "#4CAF50", text: "#4CAF50" },
    ];
    return styles[index % styles.length];
  };

  const totalTierProbability = tiers.reduce(
    (sum, tier) => sum + Number(tier.winProbability),
    0
  );
  const defaultProbability = (10000 - totalTierProbability) / 100;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#FFD700]" />
        Prize Tiers
      </h3>

      {tiers.map((tier, index) => {
        const style = getTierStyle(index);
        const Icon = TIER_ICONS[index % TIER_ICONS.length];
        const probability = Number(tier.winProbability) / 100;
        const prize = formatUnits(tier.prizeAmount, decimals);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={`rounded-xl p-4 bg-gradient-to-r ${style.bg} border`}
              style={{ borderColor: `${style.border}40` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${style.border}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: style.text }} />
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {index === 0 ? "Jackpot" : TIER_NAMES[index]}
                    </div>
                    <div className="text-sm text-gray-400">{probability}% chance</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: style.text }}>
                    {prize}
                  </div>
                  <div className="text-xs text-gray-500">{symbol}</div>
                </div>
              </div>

              {/* Progress bar showing probability */}
              <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${probability}%` }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: style.border }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Default prize */}
      {defaultPrize > 0n && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: tiers.length * 0.1 }}
        >
          <div className="rounded-xl p-4 bg-gradient-to-r from-[#4CAF50]/20 to-[#8BC34A]/10 border border-[#4CAF50]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#4CAF50]/20">
                  <Gift className="w-5 h-5 text-[#4CAF50]" />
                </div>
                <div>
                  <div className="font-bold text-white">Consolation Prize</div>
                  <div className="text-sm text-gray-400">{defaultProbability}% chance</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#4CAF50]">
                  {formatUnits(defaultPrize, decimals)}
                </div>
                <div className="text-xs text-gray-500">{symbol}</div>
              </div>
            </div>

            <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${defaultProbability}%` }}
                transition={{ duration: 0.5, delay: 0.2 + tiers.length * 0.1 }}
                className="h-full rounded-full bg-[#4CAF50]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
