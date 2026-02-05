"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ConnectButton } from "@/components/ConnectButton";
import { useContractWrite } from "@/hooks/useContract";
import { useContractOwner } from "@/hooks/useDraw";
import { getContractAddress } from "@/lib/contracts/addresses";
import { roninSaigon } from "@/lib/viem";
import { parseUnits } from "viem";

const USDC_ADDRESS = getContractAddress(roninSaigon.id, "usdc") as `0x${string}`;

interface TierInput {
  prizeAmount: string;
  winProbability: string;
}

export default function CreateDrawPage() {
  useRouter(); // Keep for potential future navigation
  const { authenticated, user } = usePrivy();
  const { data: owner } = useContractOwner();
  const { createDraw, setTiers, setDefaultPrize } = useContractWrite();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawId, setDrawId] = useState<bigint | null>(null);

  // Form state
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>(USDC_ADDRESS);
  const [tiers, setTiersState] = useState<TierInput[]>([
    { prizeAmount: "10", winProbability: "5" },
    { prizeAmount: "5", winProbability: "15" },
    { prizeAmount: "3", winProbability: "30" },
  ]);
  const [defaultPrizeAmount, setDefaultPrizeAmount] = useState("1");

  const userAddress = user?.wallet?.address?.toLowerCase();
  const isOwner = owner && userAddress && owner.toLowerCase() === userAddress;

  const totalProbability = tiers.reduce(
    (sum, t) => sum + (parseFloat(t.winProbability) || 0),
    0
  );
  const remainingProbability = 100 - totalProbability;

  const addTier = () => {
    setTiersState([...tiers, { prizeAmount: "", winProbability: "" }]);
  };

  const removeTier = (index: number) => {
    setTiersState(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TierInput, value: string) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiersState(updated);
  };

  const handleCreateDraw = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create draw
      const hash = await createDraw(tokenAddress as `0x${string}`);
      console.log("Create draw tx:", hash);

      // For now, we'll assume the draw ID is the next one
      // In production, you'd listen to events or query the contract
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create draw");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTiers = async () => {
    if (drawId === null) {
      setError("Please enter the draw ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare tier inputs
      const tierInputs = tiers.map((t) => ({
        prizeAmount: parseUnits(t.prizeAmount, 6), // USDC 6 decimals
        winProbability: BigInt(Math.round(parseFloat(t.winProbability) * 100)), // Convert to basis points
      }));

      // Set tiers
      await setTiers(drawId, tierInputs);
      console.log("Tiers set");

      // Set default prize
      if (defaultPrizeAmount && parseFloat(defaultPrizeAmount) > 0) {
        await setDefaultPrize(drawId, parseUnits(defaultPrizeAmount, 6));
        console.log("Default prize set");
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to set tiers");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-12">
          <h1 className="text-3xl font-bold text-white mb-4">Create Draw</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to continue</p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  if (!isOwner && owner) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-12">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">Only the contract owner can create draws</p>
          <Link href="/" className="mt-8 inline-block text-[#FFD700] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="text-xl font-bold text-glow-gold text-[#FFD700]">
              Lucky Spin
            </span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24 max-w-2xl">
        {/* Back link */}
        <Link
          href="/admin"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          ← Back to Admin
        </Link>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s
                    ? "bg-[#FFD700] text-black"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 ${
                    step > s ? "bg-[#FFD700]" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create Draw */}
        {step === 1 && (
          <div className="glass rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Draw</h1>
            <p className="text-gray-400 mb-8">Step 1: Initialize the draw contract</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Token Address
                </label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#FFD700] focus:outline-none"
                  placeholder="0x..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Default: USDC on Ronin Saigon
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateDraw}
                disabled={isLoading}
                className="w-full py-4 rounded-xl btn-gradient text-black font-bold uppercase tracking-wide disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Draw"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Tiers */}
        {step === 2 && (
          <div className="glass rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Configure Tiers</h1>
            <p className="text-gray-400 mb-8">Step 2: Set prize amounts and win probabilities</p>

            <div className="space-y-6">
              {/* Draw ID input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Draw ID (check the transaction or admin dashboard)
                </label>
                <input
                  type="number"
                  value={drawId?.toString() || ""}
                  onChange={(e) => setDrawId(e.target.value ? BigInt(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#FFD700] focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Tiers */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-4">
                  Prize Tiers
                </label>
                <div className="space-y-3">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={tier.prizeAmount}
                          onChange={(e) => updateTier(index, "prizeAmount", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#FFD700] focus:outline-none"
                          placeholder="Prize (USDC)"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={tier.winProbability}
                          onChange={(e) => updateTier(index, "winProbability", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#FFD700] focus:outline-none"
                          placeholder="Win % (e.g. 5)"
                        />
                      </div>
                      {tiers.length > 1 && (
                        <button
                          onClick={() => removeTier(index)}
                          className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTier}
                  className="mt-3 text-sm text-[#FFD700] hover:underline"
                >
                  + Add Tier
                </button>
              </div>

              {/* Probability summary */}
              <div className="p-4 rounded-xl bg-black/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total tier probability:</span>
                  <span className={totalProbability > 100 ? "text-red-400" : "text-white"}>
                    {totalProbability}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Default prize probability:</span>
                  <span className="text-green-400">{remainingProbability}%</span>
                </div>
              </div>

              {/* Default prize */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Default Prize (for {remainingProbability}% who don&apos;t win tiers)
                </label>
                <input
                  type="number"
                  value={defaultPrizeAmount}
                  onChange={(e) => setDefaultPrizeAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#FFD700] focus:outline-none"
                  placeholder="1"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleSetTiers}
                disabled={isLoading || totalProbability > 100 || drawId === null}
                className="w-full py-4 rounded-xl btn-gradient text-black font-bold uppercase tracking-wide disabled:opacity-50"
              >
                {isLoading ? "Configuring..." : "Set Tiers & Default Prize"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-2">Draw Created!</h1>
            <p className="text-gray-400 mb-8">
              Your draw has been created and configured.
            </p>

            <div className="space-y-4">
              <Link
                href={`/admin/draw/${drawId}`}
                className="block w-full py-4 rounded-xl btn-gradient text-black font-bold uppercase tracking-wide"
              >
                Manage Draw
              </Link>
              <Link
                href="/admin"
                className="block text-gray-400 hover:text-white"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
