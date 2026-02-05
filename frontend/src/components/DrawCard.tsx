"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Layers, Gift, ArrowRight } from "lucide-react";
import { Draw, DrawStatus } from "@/types/draw";
import { Card, StatusBadge, Button } from "./ui";
import { formatUSDC } from "@/lib/utils";

interface DrawCardProps {
  drawId: number;
  draw: Draw;
  symbol?: string;
  decimals?: number;
}

export function DrawCard({ drawId, draw }: DrawCardProps) {
  return (
    <Link href={`/draw/${drawId}`}>
      <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card
          variant="default"
          className="h-full envelope-card transition-all cursor-pointer group relative overflow-hidden"
        >
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-6 bg-gradient-to-l from-[#FFD700] to-[#FFA500] rotate-45 translate-x-6 -translate-y-2" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
              🧧 Li Xi #{drawId}
            </h3>
            <StatusBadge status={draw.status} />
          </div>

          {/* Prize Pool - Gold coin style */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border-2 border-[#FFD700]/40">
            <p className="text-xs text-[#FFB6C1] mb-1">Tong Giai Thuong</p>
            <p className="text-2xl font-bold text-[#FFD700] text-glow-gold">
              {formatUSDC(draw.fundedAmount)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat icon={Users} label="Nguoi Choi" value={draw.entrantCount.toString()} emoji="👥" />
            <Stat icon={Layers} label="Cap Bac" value={draw.tierCount.toString()} emoji="🎯" />
            <Stat
              icon={Gift}
              label="Mac Dinh"
              value={draw.defaultPrize > 0n ? formatUSDC(draw.defaultPrize, false) : "-"}
              emoji="🎁"
            />
          </div>

          {/* Action button */}
          {draw.status === DrawStatus.Open && (
            <Button className="w-full group-hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] btn-gradient">
              Tham Gia Ngay
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          {draw.status === DrawStatus.Closed && (
            <div className="text-center py-2 text-[#FFB6C1] text-sm border border-[#FFD700]/20 rounded-lg">
              Da Dong - Khong Nhan Them
            </div>
          )}
        </Card>
      </motion.div>
    </Link>
  );
}

function Stat({
  label,
  value,
  emoji,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="text-center">
      <span className="text-lg">{emoji}</span>
      <p className="text-[#FFD700] font-medium text-sm">{value}</p>
      <p className="text-[#FFF8DC]/60 text-xs">{label}</p>
    </div>
  );
}
