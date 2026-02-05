"use client";

import { cn } from "@/lib/utils";
import { DrawStatus } from "@/types/draw";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "purple" | "gold";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-[#5C0000] text-[#FFF8DC] border border-[#FFD700]/20",
  success: "bg-[#228B22]/20 text-[#90EE90] border border-[#228B22]/30",
  warning: "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30",
  error: "bg-[#DC143C]/20 text-[#FF6B6B] border border-[#DC143C]/30",
  info: "bg-[#4169E1]/20 text-[#87CEEB] border border-[#4169E1]/30",
  purple: "bg-[#8B008B]/20 text-[#DDA0DD] border border-[#8B008B]/30",
  gold: "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_VARIANTS: Record<DrawStatus, BadgeProps["variant"]> = {
  [DrawStatus.Open]: "success",
  [DrawStatus.Closed]: "warning",
  [DrawStatus.Cancelled]: "error",
};

const STATUS_LABELS: Record<DrawStatus, string> = {
  [DrawStatus.Open]: "🟢 Dang Mo",
  [DrawStatus.Closed]: "🟡 Da Dong",
  [DrawStatus.Cancelled]: "🔴 Da Huy",
};

export function StatusBadge({ status }: { status: DrawStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
