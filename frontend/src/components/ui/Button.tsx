"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "red";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold uppercase tracking-wide rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] border-2 border-[#8B0000]/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:scale-105 active:scale-95",
      secondary:
        "bg-[#5C0000] text-[#FFD700] hover:bg-[#6B0000] border border-[#FFD700]/30",
      danger:
        "bg-[#DC143C]/20 text-[#FF6B6B] hover:bg-[#DC143C]/30 border border-[#DC143C]/30",
      ghost: "text-[#FFD700]/70 hover:text-[#FFD700] hover:bg-[#FFD700]/10",
      red:
        "bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-[#FFD700] border-2 border-[#FFD700]/50 hover:shadow-[0_0_30px_rgba(220,20,60,0.6)] hover:scale-105 active:scale-95",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
