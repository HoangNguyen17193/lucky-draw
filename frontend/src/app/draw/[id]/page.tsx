"use client";

import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { TierList } from "@/components/TierList";
import { SpinWheel } from "@/components/SpinWheel/SpinWheel";
import { Card, Button, StatusBadge, LoadingScreen } from "@/components/ui";
import {
  useDraw,
  useTiers,
  useUserResult,
  useIsWhitelisted,
} from "@/hooks/useDraw";
import { useContractWrite } from "@/hooks/useContract";
import { DrawStatus, Tier } from "@/types/draw";
import { useState } from "react";
import { formatUSDC } from "@/lib/utils";

export default function DrawPage() {
  const params = useParams();
  const drawId = BigInt(params.id as string);
  const { authenticated, user } = usePrivy();
  const userAddress = user?.wallet?.address as `0x${string}` | undefined;

  const { data: draw, isLoading: drawLoading, refetch: refetchDraw } = useDraw(drawId);
  const { data: tiers, isLoading: tiersLoading } = useTiers(
    drawId,
    draw?.tierCount ?? 0n
  );
  const { data: userResult, refetch: refetchUserResult } = useUserResult(drawId, userAddress);
  const { data: isWhitelisted } = useIsWhitelisted(userAddress);
  const { enterDraw } = useContractWrite();

  const [isEntering, setIsEntering] = useState(false);
  const [isWaitingVRF, setIsWaitingVRF] = useState(false);
  const [showWheel, setShowWheel] = useState(false); // Show wheel immediately when entering

  const hasEntered = userResult?.hasEntered ?? false;
  const hasResult = userResult?.hasResult ?? false;
  const userTierIndex = hasResult
    ? userResult?.tierIndex === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
      ? null
      : Number(userResult?.tierIndex)
    : -1;

  const canSpin = hasEntered && hasResult;
  const canEnter =
    authenticated &&
    isWhitelisted &&
    !hasEntered &&
    draw?.status === DrawStatus.Open;

  const handleEnter = async () => {
    if (!authenticated || isEntering) return;

    setIsEntering(true);
    setIsWaitingVRF(false);
    setShowWheel(true); // Show wheel immediately when clicking enter
    
    try {
      const hash = await enterDraw(drawId);
      
      // Transaction confirmed - now waiting for VRF
      setIsEntering(false);
      setIsWaitingVRF(true);
      
      toast.success("Entry submitted! The wheel is spinning...", {
        description: `Transaction: ${hash.slice(0, 10)}...`,
        action: {
          label: "View",
          onClick: () => window.open(`https://app.roninchain.com/tx/${hash}`, "_blank"),
        },
      });

      // Poll until we get a result
      const pollInterval = setInterval(async () => {
        const result = await refetchUserResult();
        if (result.data?.hasResult) {
          clearInterval(pollInterval);
          setIsWaitingVRF(false);
          // Don't show toast - the wheel will stop and show confetti
          refetchDraw();
        }
      }, 2000); // Poll more frequently for better UX

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsWaitingVRF(false);
        toast.info("VRF is taking longer than expected. Check back soon!");
      }, 120000);

    } catch (error) {
      console.error("Failed to enter:", error);
      toast.error("Failed to enter draw", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsEntering(false);
      setIsWaitingVRF(false);
      setShowWheel(false); // Hide wheel on error
    }
  };

  if (drawLoading) {
    return <LoadingScreen message="Loading draw..." />;
  }

  if (!draw) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Draw Not Found</h1>
          <p className="text-gray-400 mb-6">The draw you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="container mx-auto px-4 pt-24">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to draws
          </Link>
        </motion.div>

        {/* Draw header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Draw #{drawId.toString()}
            </h1>
            <StatusBadge status={draw.status} />
          </div>

          <Card variant="glow" padding="md" className="md:text-right">
            <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {formatUSDC(draw.fundedAmount)}
            </p>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Wheel & Entry */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            {/* Status messages - Tết themed */}
            <AnimatePresence mode="wait">
              {!authenticated && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="mb-8 text-center w-full max-w-md envelope-card">
                    <span className="text-4xl block mb-4">👛</span>
                    <p className="text-[#FFD700] mb-4">
                      Connect your wallet to receive lucky money
                    </p>
                  </Card>
                </motion.div>
              )}

              {authenticated && !isWhitelisted && (
                <motion.div
                  key="not-whitelisted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card variant="bordered" className="mb-8 text-center w-full max-w-md border-[#FFD700]/50">
                    <AlertCircle className="w-10 h-10 text-[#FFD700] mx-auto mb-4" />
                    <p className="text-[#FFD700]">
                      Your wallet is not invited to participate
                    </p>
                  </Card>
                </motion.div>
              )}


            </AnimatePresence>

            {/* Spin wheel - always show full wheel */}
            {tiers ? (
              <SpinWheel
                tiers={tiers as Tier[]}
                defaultPrize={draw.defaultPrize}
                userTierIndex={userTierIndex}
                userPrizeAmount={hasResult ? userResult?.prizeAmount : undefined}
                canSpin={canSpin}
                symbol="USDC"
                decimals={6}
                isWaitingForResult={isWaitingVRF || (showWheel && !hasResult)}
                isIdle={canEnter && !showWheel}
                onEnterClick={handleEnter}
                isEntering={isEntering}
              />
            ) : (
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-[#FFD700] via-[#E040FB] to-[#00BCD4] blur-3xl"
                />
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-[#1a2744] border-4 border-[#FFD700]/30 flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="text-7xl md:text-8xl"
                  >
                    🎡
                  </motion.span>
                </div>
              </div>
            )}



            {draw.status === DrawStatus.Closed && !hasEntered && (
              <Card className="mt-8 text-center envelope-card">
                <p className="text-[#FFD700]">🔒 This draw is closed - no more participants accepted</p>
              </Card>
            )}
          </motion.div>

          {/* Right: Info & Tiers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Entrants</p>
                    <p className="text-xl font-bold text-white">{draw.entrantCount.toString()}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Distributed</p>
                    <p className="text-xl font-bold text-white">{formatUSDC(draw.totalDistributed)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tiers */}
            {!tiersLoading && tiers && (
              <TierList
                tiers={tiers as Tier[]}
                defaultPrize={draw.defaultPrize}
                symbol="USDC"
                decimals={6}
              />
            )}

            {/* User's result */}
            {hasResult && userResult && (
              <Card variant="glow">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  🎉 Your Prize
                </h3>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    {formatUSDC(userResult.prizeAmount)}
                  </p>
                  <p className="text-gray-400 mt-2">
                    {userTierIndex === null
                      ? "Consolation Prize"
                      : userTierIndex === 0
                      ? "🏆 JACKPOT!"
                      : `Tier ${userTierIndex + 1}`}
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
