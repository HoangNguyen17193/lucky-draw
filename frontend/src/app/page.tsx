"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DrawCard } from "@/components/DrawCard";
import { Card, Spinner } from "@/components/ui";
import { useNextDrawId, useDraw } from "@/hooks/useDraw";
import { Draw } from "@/types/draw";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Cherry blossom petals component
function CherryBlossoms() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: -50,
            rotate: 0 
          }}
          animate={{ 
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
            rotate: 720,
            x: `calc(${Math.random() * 100}vw + ${Math.sin(i) * 100}px)`
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
        >
          {i % 3 === 0 ? "🌸" : i % 3 === 1 ? "🏮" : "✨"}
        </motion.div>
      ))}
    </div>
  );
}

function DrawsList() {
  const { data: nextDrawId, isLoading } = useNextDrawId();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!nextDrawId || nextDrawId === 0n) {
    return (
      <Card className="text-center py-12 envelope-card">
        <span className="text-6xl block mb-4">🧧</span>
        <p className="text-[#FFD700] text-lg">No lucky money available yet</p>
        <p className="text-[#FFB6C1] text-sm mt-2">Come back later to receive lucky money!</p>
      </Card>
    );
  }

  const drawIds = Array.from({ length: Number(nextDrawId) }, (_, i) => i);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {drawIds.map((id) => (
        <motion.div key={id} variants={fadeInUp}>
          <DrawCardWrapper drawId={id} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function DrawCardWrapper({ drawId }: { drawId: number }) {
  const { data: draw, isLoading } = useDraw(BigInt(drawId));

  if (isLoading || !draw) {
    return (
      <Card className="animate-pulse envelope-card">
        <div className="h-6 bg-[#FFD700]/20 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-[#FFD700]/20 rounded w-full" />
          <div className="h-4 bg-[#FFD700]/20 rounded w-2/3" />
          <div className="h-4 bg-[#FFD700]/20 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  return <DrawCard drawId={drawId} draw={draw as Draw} />;
}



export default function Home() {
  return (
    <main className="min-h-screen relative">
      <CherryBlossoms />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background effects - Tết themed */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#DC143C]/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#FF8C00]/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Tết greeting */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-6"
            >
              <span className="text-6xl md:text-8xl">🧧</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
              <span className="text-[#FFD700] text-glow-gold">Li Xi Tet</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-medium mb-6 text-[#FFB6C1]">
              Happy New Year 2026 🐴
            </h2>
            <p className="text-xl text-[#FFF8DC]/80 max-w-2xl mx-auto mb-10">
              Lucky draw for lucky money at the beginning of the year. 
              Fair, transparent and verifiable with Chainlink VRF.
            </p>
          </motion.div>

          {/* Animated red envelope preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-64 h-64 mx-auto mb-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #FFD700, #DC143C, #FF8C00, #FFE55C, #B22222, #FFA500, #DAA520, #CD5C5C, #FFD700)",
                opacity: 0.3,
                filter: "blur(40px)",
              }}
            />
            <div className="absolute inset-8 rounded-full bg-gradient-to-b from-[#DC143C] to-[#8B0000] flex items-center justify-center border-4 border-[#FFD700]">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >
                福
              </motion.div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: "100%", label: "Fair", emoji: "✨" },
              { value: "VRF", label: "Chainlink", emoji: "🔗" },
              { value: "Instant", label: "Rewards", emoji: "⚡" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-[#FFD700] text-glow-gold">
                  {stat.emoji} {stat.value}
                </div>
                <div className="text-xs md:text-sm text-[#FFB6C1]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Active Draws */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-[#FFD700] text-glow-gold flex items-center gap-3">
                🧧 Active Draws
              </h2>
              <p className="text-[#FFB6C1] mt-1">Join to have a chance to receive lucky money</p>
            </div>
            <Link
              href="/admin"
              className="text-sm text-[#FFD700] hover:text-[#FFE55C] hidden md:block border border-[#FFD700]/30 px-4 py-2 rounded-lg hover:bg-[#FFD700]/10 transition-all"
            >
              Manage →
            </Link>
          </motion.div>
          <DrawsList />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#5C0000] to-[#3D0000] relative z-10">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-[#FFD700] text-center mb-12 text-glow-gold"
          >
            🏮 How to Participate 🏮
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              { step: "1", icon: "👛", title: "Connect Wallet", desc: "Connect your wallet to get started" },
              { step: "2", icon: "🎫", title: "Join", desc: "Register to participate if you are invited" },
              { step: "3", icon: "🎲", title: "Wait", desc: "VRF generates transparent random numbers" },
              { step: "4", icon: "🧧", title: "Receive Reward", desc: "Spin the wheel and receive lucky money" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="relative inline-block">
                  <motion.div 
                    className="text-5xl mb-4"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring" }}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="absolute -top-2 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#8B0000] text-sm font-bold flex items-center justify-center border-2 border-[#8B0000]">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#FFD700] mb-2">{item.title}</h3>
                <p className="text-[#FFF8DC]/70 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t-2 border-[#FFD700]/20 bg-[#3D0000] relative z-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧧</span>
            <span className="font-bold text-[#FFD700]">Li Xi Tet 2026</span>
          </div>
          <p className="text-[#FFB6C1] text-sm text-center">
            Powered by Chainlink VRF • Ronin Saigon Testnet • 🐴 Year of the Horse
          </p>
          <div className="flex gap-4">
            <span className="text-[#FFD700]/60 text-sm">
              Happy New Year ✨
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
