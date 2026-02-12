"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Tier } from "@/types/draw";
import { formatUnits } from "viem";
import { cn } from "@/lib/utils";
import { playSpinningSound, playWinSound, playSlowdownSound, playClickSound } from "@/lib/sounds";

interface SpinWheelProps {
  tiers: Tier[];
  defaultPrize: bigint;
  decimals?: number;
  symbol?: string;
  userTierIndex: number | null; // -1 = not determined yet, null = default prize, number = tier index
  userPrizeAmount?: bigint; // Actual prize amount from contract
  onSpinComplete?: (tierIndex: number | null, amount: string) => void;
  canSpin: boolean;
  isWaitingForResult?: boolean; // New prop: true when tx submitted but waiting for VRF
  isIdle?: boolean; // New prop: true when showing wheel in idle state (before user enters)
  onEnterClick?: () => void; // Callback when user clicks to enter in idle state
  isEntering?: boolean; // True when tx is being submitted
}

interface WheelSegment {
  label: string;
  amount: string;
  color: string;
  gradient: string;
  tierIndex: number | null;
}

// Tết-themed colors - Red, Gold, Orange tones
const SEGMENT_COLORS = [
  { color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }, // Gold
  { color: "#DC143C", gradient: "linear-gradient(135deg, #DC143C 0%, #8B0000 100%)" }, // Crimson Red
  { color: "#FF8C00", gradient: "linear-gradient(135deg, #FF8C00 0%, #FF6600 100%)" }, // Orange
  { color: "#FFE55C", gradient: "linear-gradient(135deg, #FFE55C 0%, #FFD700 100%)" }, // Light Gold
  { color: "#B22222", gradient: "linear-gradient(135deg, #B22222 0%, #8B0000 100%)" }, // Firebrick Red
  { color: "#FFA500", gradient: "linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)" }, // Orange
  { color: "#DAA520", gradient: "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)" }, // Goldenrod
  { color: "#CD5C5C", gradient: "linear-gradient(135deg, #CD5C5C 0%, #DC143C 100%)" }, // Indian Red
  { color: "#E8B800", gradient: "linear-gradient(135deg, #E8B800 0%, #CC9900 100%)" }, // Deep Gold
  { color: "#CC0033", gradient: "linear-gradient(135deg, #CC0033 0%, #990022 100%)" }, // Ruby Red
  { color: "#FF7733", gradient: "linear-gradient(135deg, #FF7733 0%, #E65C00 100%)" }, // Burnt Orange
  { color: "#FFD54F", gradient: "linear-gradient(135deg, #FFD54F 0%, #FFCA28 100%)" }, // Amber Gold
];

export function SpinWheel({
  tiers,
  defaultPrize,
  decimals = 6,
  symbol = "USDC",
  userTierIndex,
  userPrizeAmount,
  onSpinComplete,
  canSpin,
  isWaitingForResult = false,
  isIdle = false,
  onEnterClick,
  isEntering = false,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWaitingSpinning, setIsWaitingSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [result, setResult] = useState<{ label: string; amount: string } | null>(null);
  const waitingAnimationRef = useRef<number | null>(null);
  const previousUserTierIndexRef = useRef<number | null | undefined>(undefined);
  const spinSoundRef = useRef<{ stop: () => void } | null>(null);
  const hasInitializedRef = useRef(false);

  const segments = useMemo((): WheelSegment[] => {
    const totalSegments = 12;

    // Calculate raw segment counts per tier, ensuring at least 1 each
    const rawCounts = tiers.map((tier) => {
      const probability = Number(tier.winProbability);
      return Math.max(1, Math.round((probability / 10000) * totalSegments));
    });

    // If tiers over-fill, scale down proportionally while keeping at least 1 each
    let tierTotal = rawCounts.reduce((a, b) => a + b, 0);
    if (tierTotal > totalSegments) {
      const scale = totalSegments / tierTotal;
      rawCounts.forEach((_, i) => {
        rawCounts[i] = Math.max(1, Math.floor(rawCounts[i] * scale));
      });
      tierTotal = rawCounts.reduce((a, b) => a + b, 0);
      // If still over, trim the largest counts
      while (tierTotal > totalSegments) {
        const maxIdx = rawCounts.indexOf(Math.max(...rawCounts));
        if (rawCounts[maxIdx] > 1) {
          rawCounts[maxIdx]--;
          tierTotal--;
        } else break;
      }
    }

    const segs: WheelSegment[] = [];
    let segmentIndex = 0;

    tiers.forEach((tier, tierIdx) => {
      for (let i = 0; i < rawCounts[tierIdx] && segmentIndex < totalSegments; i++) {
        const colorSet = SEGMENT_COLORS[segmentIndex % SEGMENT_COLORS.length];
        segs.push({
          label: tierIdx === 0 ? "JACKPOT!" : `${formatUnits(tier.prizeAmount, decimals)} ${symbol}`,
          amount: formatUnits(tier.prizeAmount, decimals),
          color: colorSet.color,
          gradient: colorSet.gradient,
          tierIndex: tierIdx,
        });
        segmentIndex++;
      }
    });

    while (segmentIndex < totalSegments) {
      const colorSet = SEGMENT_COLORS[segmentIndex % SEGMENT_COLORS.length];
      segs.push({
        label: `${formatUnits(defaultPrize, decimals)} ${symbol}`,
        amount: formatUnits(defaultPrize, decimals),
        color: colorSet.color,
        gradient: colorSet.gradient,
        tierIndex: null,
      });
      segmentIndex++;
    }

    return segs;
  }, [tiers, defaultPrize, decimals, symbol]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    segments.forEach((seg, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill with solid color
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Add segment border
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px sans-serif";
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.shadowBlur = 2;
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();
    });

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw center circle (matches button size: 80px = 40px radius)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a2744";
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, [segments, rotation]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Start continuous spinning when entering or waiting for VRF result
  useEffect(() => {
    const shouldSpin = (isEntering || isWaitingForResult) && !hasSpun;
    
    if (shouldSpin && !isWaitingSpinning) {
      setIsWaitingSpinning(true);
      let currentRotation = 0;
      const speed = 8; // degrees per frame

      // Start spinning sound
      try {
        spinSoundRef.current = playSpinningSound();
      } catch (e) {
        console.log('Audio not available:', e);
      }

      const animate = () => {
        currentRotation += speed;
        setRotation(currentRotation);
        waitingAnimationRef.current = requestAnimationFrame(animate);
      };

      waitingAnimationRef.current = requestAnimationFrame(animate);
    }
    
    // Stop spinning if conditions no longer met (but not if we're about to land on prize)
    if (!shouldSpin && isWaitingSpinning && !isSpinning) {
      if (waitingAnimationRef.current) {
        cancelAnimationFrame(waitingAnimationRef.current);
        waitingAnimationRef.current = null;
      }
      // Stop spinning sound
      if (spinSoundRef.current) {
        spinSoundRef.current.stop();
        spinSoundRef.current = null;
      }
      setIsWaitingSpinning(false);
    }
  }, [isEntering, isWaitingForResult, isWaitingSpinning, hasSpun, isSpinning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waitingAnimationRef.current) {
        cancelAnimationFrame(waitingAnimationRef.current);
      }
      if (spinSoundRef.current) {
        spinSoundRef.current.stop();
      }
    };
  }, []);

  const findTargetSegment = useCallback((tierIdx: number | null, prizeAmount?: bigint): number => {
    const amountStr = prizeAmount !== undefined ? formatUnits(prizeAmount, decimals) : undefined;

    // Collect all candidate segment indices that match
    let candidates: number[] = [];

    if (tierIdx === null) {
      // Default prize -- match by tierIndex null and amount
      candidates = segments
        .map((s, i) => (s.tierIndex === null && (!amountStr || s.amount === amountStr) ? i : -1))
        .filter((i) => i !== -1);
      if (candidates.length === 0) {
        candidates = segments.map((s, i) => (s.tierIndex === null ? i : -1)).filter((i) => i !== -1);
      }
    } else {
      // Tier prize -- match by tierIndex and optionally amount
      candidates = segments
        .map((s, i) => (s.tierIndex === tierIdx && (!amountStr || s.amount === amountStr) ? i : -1))
        .filter((i) => i !== -1);
      if (candidates.length === 0) {
        candidates = segments.map((s, i) => (s.tierIndex === tierIdx ? i : -1)).filter((i) => i !== -1);
      }
    }

    if (candidates.length === 0) return 0;
    // Randomly pick among matching segments so the wheel doesn't always land on the same one
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [segments, decimals]);

  // Handle returning users who already have a result - show result directly
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    // If user already has result on page load, show it directly
    if (canSpin && userTierIndex !== -1 && userPrizeAmount !== undefined && !hasSpun) {
      hasInitializedRef.current = true;
      
      const sliceAngle = 360 / segments.length;
      const targetSegmentIndex = findTargetSegment(userTierIndex, userPrizeAmount);

      // Set rotation to land on the correct segment
      const targetAngle = 360 - (targetSegmentIndex * sliceAngle + sliceAngle / 2);
      setRotation(targetAngle);
      setHasSpun(true);

      const actualAmount = formatUnits(userPrizeAmount, decimals);
      setResult({ label: `${actualAmount} ${symbol}`, amount: actualAmount });
    }
  }, [canSpin, userTierIndex, userPrizeAmount, hasSpun, segments, decimals, symbol, findTargetSegment]);

  // When result arrives (userTierIndex changes from -1 to actual value), stop and land on prize
  useEffect(() => {
    const prevIndex = previousUserTierIndexRef.current;
    previousUserTierIndexRef.current = userTierIndex;

    // Check if we just got the result (was -1, now is a real value)
    if (prevIndex === -1 && userTierIndex !== -1 && isWaitingSpinning && !hasSpun) {
      // Stop the waiting animation
      if (waitingAnimationRef.current) {
        cancelAnimationFrame(waitingAnimationRef.current);
        waitingAnimationRef.current = null;
      }

      // Stop spinning sound and play slowdown sound
      if (spinSoundRef.current) {
        spinSoundRef.current.stop();
        spinSoundRef.current = null;
      }
      try {
        playSlowdownSound();
      } catch (e) {
        console.log('Audio not available:', e);
      }

      // Now do the final spin to land on the prize
      setIsWaitingSpinning(false);
      setIsSpinning(true);

      const sliceAngle = 360 / segments.length;
      const targetSegmentIndex = findTargetSegment(userTierIndex, userPrizeAmount);

      // Calculate final position
      const currentRotationMod = rotation % 360;
      const targetAngle = 360 - (targetSegmentIndex * sliceAngle + sliceAngle / 2);
      
      // Add extra spins for dramatic effect
      const extraSpins = 3 + Math.random() * 2;
      let totalRotation = extraSpins * 360 + targetAngle;
      
      // Adjust to make sure we're going forward
      if (totalRotation < currentRotationMod) {
        totalRotation += 360;
      }

      const startRotation = rotation;
      const deltaRotation = totalRotation - (startRotation % 360) + Math.floor(startRotation / 360) * 360;
      const finalRotation = startRotation + deltaRotation;

      let startTime: number;
      const duration = 4000;

      const animateFinal = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease out for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRot = startRotation + (finalRotation - startRotation) * easeOut;

        setRotation(currentRot);

        if (progress < 1) {
          requestAnimationFrame(animateFinal);
        } else {
          setIsSpinning(false);
          setHasSpun(true);

          const actualAmount = userPrizeAmount !== undefined 
            ? formatUnits(userPrizeAmount, decimals)
            : segments[targetSegmentIndex].amount;
          setResult({ label: `${actualAmount} ${symbol}`, amount: actualAmount });

          // Play win celebration sound
          try {
            playWinSound();
          } catch (e) {
            console.log('Audio not available:', e);
          }

          // Tết celebration confetti - Red and Gold
          const confettiDuration = 3000;
          const end = Date.now() + confettiDuration;

          const frame = () => {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ["#FFD700", "#DC143C", "#FF8C00", "#FFA500", "#FFE55C"],
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ["#FFD700", "#DC143C", "#FF8C00", "#FFA500", "#FFE55C"],
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();

          onSpinComplete?.(segments[targetSegmentIndex].tierIndex, actualAmount);
        }
      };

      requestAnimationFrame(animateFinal);
    }
  }, [userTierIndex, isWaitingSpinning, hasSpun, segments, rotation, onSpinComplete, findTargetSegment, userPrizeAmount, decimals, symbol]);

  const spinWheel = useCallback(() => {
    if (isSpinning || !canSpin || hasSpun) return;

    setIsSpinning(true);

    const sliceAngle = 360 / segments.length;
    const targetSegmentIndex = findTargetSegment(userTierIndex, userPrizeAmount);

    const spins = 5 + Math.random() * 3;
    const targetAngle = 360 - (targetSegmentIndex * sliceAngle + sliceAngle / 2);
    const totalRotation = spins * 360 + targetAngle;

    let startTime: number;
    const duration = 5000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = totalRotation * easeOut;

      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setHasSpun(true);

        const actualAmount = userPrizeAmount !== undefined
          ? formatUnits(userPrizeAmount, decimals)
          : segments[targetSegmentIndex].amount;
        setResult({ label: `${actualAmount} ${symbol}`, amount: actualAmount });

        // Tết celebration confetti - Red and Gold
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#FFD700", "#DC143C", "#FF8C00", "#FFA500", "#FFE55C"],
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#FFD700", "#DC143C", "#FF8C00", "#FFA500", "#FFE55C"],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();

        onSpinComplete?.(segments[targetSegmentIndex].tierIndex, actualAmount);
      }
    };

    requestAnimationFrame(animate);
  }, [segments, userTierIndex, isSpinning, canSpin, hasSpun, onSpinComplete, findTargetSegment, userPrizeAmount, decimals, symbol]);

  return (
    <div className="flex flex-col items-center">
      {/* Tết-themed glow effect - Red and Gold */}
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-[#FFD700] via-[#DC143C] to-[#FF8C00] blur-3xl pointer-events-none"
        />

        {/* Wheel container - clickable */}
        <motion.div 
          className={cn(
            "relative w-[400px] h-[400px] rounded-full",
            (isIdle && !isEntering) || (canSpin && !isSpinning && !isWaitingSpinning && !hasSpun)
              ? "cursor-pointer"
              : isEntering || isWaitingSpinning || isSpinning
              ? "cursor-wait"
              : "cursor-default"
          )}
          whileHover={(isIdle && !isEntering) || (canSpin && !isSpinning && !isWaitingSpinning && !hasSpun) ? { scale: 1.03 } : {}}
          whileTap={(isIdle && !isEntering) || (canSpin && !isSpinning && !isWaitingSpinning && !hasSpun) ? { scale: 0.98 } : {}}
          onClick={() => {
            if (isIdle && !isEntering && onEnterClick) {
              try {
                playClickSound();
              } catch (e) {
                console.log('Audio not available:', e);
              }
              onEnterClick();
            } else if (canSpin && !isSpinning && !isWaitingSpinning && !hasSpun) {
              try {
                playClickSound();
              } catch (e) {
                console.log('Audio not available:', e);
              }
              spinWheel();
            }
          }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="relative z-10 w-full h-full"
          />

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div
              animate={isSpinning || isWaitingSpinning ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 0.1, repeat: isSpinning || isWaitingSpinning ? Infinity : 0 }}
              className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
            />
          </div>

          {/* Center display - Tết themed with 福 character */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none",
              "w-20 h-20 rounded-full font-bold text-sm flex items-center justify-center",
              "transition-all duration-200 border-4 border-[#8B0000]",
              isEntering || isWaitingSpinning || isSpinning
                ? "bg-gradient-to-br from-[#FFE55C] to-[#DAA520] text-[#8B0000] shadow-[0_0_30px_rgba(255,215,0,0.6)] animate-pulse"
                : isIdle || (canSpin && !hasSpun)
                ? "bg-gradient-to-br from-[#FFE55C] to-[#DAA520] text-[#8B0000] shadow-[0_0_30px_rgba(255,215,0,0.5)]"
                : "bg-[#5C0000] text-[#8B4513] border-[#5C0000]"
            )}
          >
            {isEntering ? (
              <span className="text-2xl">⏳</span>
            ) : isWaitingSpinning ? (
              <span className="text-2xl">🎲</span>
            ) : isSpinning ? (
              <span className="text-2xl">🎲</span>
            ) : hasSpun ? (
              <span className="text-2xl">🧧</span>
            ) : (
              <span className="text-2xl">福</span>
            )}
          </div>
          
        </motion.div>
        
        {/* Hint text below wheel */}
        <div className="h-8 mt-4 flex items-center justify-center">
          {isIdle && !isEntering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#FFD700] text-sm font-medium whitespace-nowrap"
            >
              Click to receive lucky money 🧧
            </motion.div>
          )}
          
          {isEntering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#FFD700] text-sm font-medium whitespace-nowrap"
            >
              Please sign the transaction...
            </motion.div>
          )}
        </div>
      </div>

      {/* Result - Tết styled red envelope reveal */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-6xl mb-4"
            >
              🧧
            </motion.div>
            <p className="text-xl text-[#FFD700] mb-2">Congratulations! You received</p>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] blur-lg opacity-50" />
              <p className="relative text-5xl font-bold text-[#FFD700] text-glow-gold">
                {result.amount} {symbol}
              </p>
            </motion.div>
            <p className="text-lg text-[#FFB6C1] mt-3">{result.label}</p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-2xl"
            >
              🎊 Happy New Year! 🎊
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
