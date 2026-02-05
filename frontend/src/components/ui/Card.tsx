"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "glow" | "envelope";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const baseStyles =
      "rounded-2xl backdrop-blur-xl";

    const variants = {
      default: "bg-[rgba(139,0,0,0.6)] border border-[#FFD700]/20",
      bordered: "bg-[rgba(139,0,0,0.6)] border-2 border-[#FFD700]/30",
      glow: "bg-[rgba(139,0,0,0.6)] border border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]",
      envelope: "bg-gradient-to-b from-[#DC143C] to-[#8B0000] border-2 border-[#FFD700] shadow-lg",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
