"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#8B0000]/95 via-[#A52A2A]/95 to-[#8B0000]/95 backdrop-blur-xl border-b-2 border-[#FFD700]/30"
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
      
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Red envelope icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
            className="relative w-12 h-14 flex items-center justify-center"
          >
            {/* Envelope body */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#DC143C] to-[#8B0000] rounded-lg border-2 border-[#FFD700] shadow-lg" />
            {/* Gold decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE55C] to-[#DAA520] border border-[#B8860B] flex items-center justify-center">
              <span className="text-[#8B0000] font-bold text-sm">福</span>
            </div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#FFD700] text-glow-gold">
              Li Xi Tet
            </span>
            <span className="text-[10px] text-[#FFB6C1]">Lucky Money 2025</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/" active={pathname === "/"}>
            🏠 Home
          </NavLink>
          <NavLink href="/admin" active={isAdmin}>
            <LayoutDashboard className="w-4 h-4 mr-1" />
            Manage
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
              Admin Mode
            </span>
          )}
          <ConnectButton />
        </div>
      </div>
      
      {/* Decorative lanterns */}
      <div className="absolute -bottom-2 left-8 hidden lg:block">
        <motion.div
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl"
        >
          🏮
        </motion.div>
      </div>
      <div className="absolute -bottom-2 right-8 hidden lg:block">
        <motion.div
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl"
        >
          🏮
        </motion.div>
      </div>
    </motion.header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-sm font-medium transition-colors px-3 py-1.5 rounded-lg",
        active 
          ? "text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30" 
          : "text-[#FFF8DC]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/5"
      )}
    >
      {children}
    </Link>
  );
}
