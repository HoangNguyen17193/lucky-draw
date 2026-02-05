"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";
import { Button } from "./ui";

export function ConnectButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!ready) {
    return (
      <div className="w-32 h-10 rounded-xl bg-white/10 animate-pulse" />
    );
  }

  if (authenticated && user) {
    const address = user.wallet?.address;
    const displayAddress = address ? shortenAddress(address) : "Connected";

    return (
      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E040FB] flex items-center justify-center">
            <Wallet className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm font-medium text-white">{displayAddress}</span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </motion.button>

        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1a2744] border border-white/10 shadow-xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10">
              <p className="text-xs text-gray-400">Connected Wallet</p>
              <p className="text-sm font-mono text-white truncate">{address}</p>
            </div>
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <Button onClick={login} size="md">
      <Wallet className="w-4 h-4 mr-2" />
      Connect
    </Button>
  );
}
