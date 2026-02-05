"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { ArrowLeft, Info, Users, Wallet, Settings } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { TierList } from "@/components/TierList";
import { Card, Button, StatusBadge, LoadingScreen } from "@/components/ui";
import {
  useDraw,
  useTiers,
  useContractOwner,
} from "@/hooks/useDraw";
import { useContractWrite } from "@/hooks/useContract";
import { DrawStatus, Tier } from "@/types/draw";
import { parseUnits } from "viem";
import { formatUSDC } from "@/lib/utils";

export default function AdminDrawPage() {
  const params = useParams();
  const drawId = BigInt(params.id as string);
  const { authenticated, user } = usePrivy();

  const { data: draw, isLoading: drawLoading, refetch: refetchDraw } = useDraw(drawId);
  const { data: tiers } = useTiers(drawId, draw?.tierCount ?? 0n);
  const { data: owner } = useContractOwner();

  const {
    setWhitelistBatch,
    approveToken,
    fundDraw,
    closeDraw,
    withdrawLeftover,
    cancelDraw,
  } = useContractWrite();

  const [activeTab, setActiveTab] = useState<"info" | "whitelist" | "fund" | "actions">("info");
  const [whitelistInput, setWhitelistInput] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userAddress = user?.wallet?.address?.toLowerCase();
  const isOwner = owner && userAddress && owner.toLowerCase() === userAddress;

  const handleWhitelist = async () => {
    setIsLoading(true);
    try {
      const addresses = whitelistInput
        .split(/[\n,]/)
        .map((a) => a.trim())
        .filter((a) => a.startsWith("0x") && a.length === 42) as `0x${string}`[];

      if (addresses.length === 0) {
        throw new Error("No valid addresses found");
      }

      await setWhitelistBatch(addresses, true);
      toast.success(`Whitelisted ${addresses.length} addresses`);
      setWhitelistInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to whitelist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFund = async () => {
    if (!draw) return;
    setIsLoading(true);
    try {
      const amount = parseUnits(fundAmount, 6);
      
      toast.info("Approving tokens...");
      await approveToken(draw.token, amount);
      
      toast.info("Funding draw...");
      await fundDraw(drawId, amount);
      
      toast.success(`Funded ${fundAmount} USDC`);
      setFundAmount("");
      await refetchDraw();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fund");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDraw = async () => {
    setIsLoading(true);
    try {
      await closeDraw(drawId);
      toast.success("Draw closed - no more entries allowed");
      await refetchDraw();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close draw");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userAddress) return;
    setIsLoading(true);
    try {
      await withdrawLeftover(drawId, userAddress as `0x${string}`);
      toast.success("Leftover withdrawn");
      await refetchDraw();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this draw? Remaining funds will be returned.")) return;
    
    setIsLoading(true);
    try {
      await cancelDraw(drawId);
      toast.success("Draw cancelled");
      await refetchDraw();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Header />
        <Card className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Access</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to continue</p>
        </Card>
      </main>
    );
  }

  if (!isOwner && owner) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Header />
        <Card className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">Only the contract owner can manage draws</p>
        </Card>
      </main>
    );
  }

  if (drawLoading || !draw) {
    return <LoadingScreen message="Loading draw..." />;
  }

  const leftover = draw.fundedAmount - draw.totalDistributed;

  const tabs = [
    { id: "info" as const, label: "Info", icon: Info },
    { id: "whitelist" as const, label: "Whitelist", icon: Users },
    { id: "fund" as const, label: "Fund", icon: Wallet },
    { id: "actions" as const, label: "Actions", icon: Settings },
  ];

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="container mx-auto px-4 pt-24">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Admin
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
              Manage Draw #{drawId.toString()}
            </h1>
            <StatusBadge status={draw.status} />
          </div>

          <Card variant="glow" padding="md" className="md:text-right">
            <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {formatUSDC(draw.fundedAmount)}
            </p>
            {leftover > 0n && draw.status === DrawStatus.Closed && (
              <p className="text-xs text-gray-500 mt-1">
                Leftover: {formatUSDC(leftover)}
              </p>
            )}
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Tab */}
            {activeTab === "info" && (
              <>
                <Card>
                  <h3 className="text-lg font-bold text-white mb-4">Draw Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Token</p>
                      <p className="text-white font-mono text-sm truncate">{draw.token}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Entrants</p>
                      <p className="text-white font-bold text-xl">{draw.entrantCount.toString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Distributed</p>
                      <p className="text-white font-bold">{formatUSDC(draw.totalDistributed)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Available</p>
                      <p className="text-white font-bold">{formatUSDC(leftover > 0n ? leftover : 0n)}</p>
                    </div>
                  </div>
                </Card>

                {tiers && (
                  <TierList
                    tiers={tiers as Tier[]}
                    defaultPrize={draw.defaultPrize}
                    symbol="USDC"
                    decimals={6}
                  />
                )}
              </>
            )}

            {/* Whitelist Tab */}
            {activeTab === "whitelist" && (
              <Card>
                <h3 className="text-lg font-bold text-white mb-4">Add to Whitelist</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Enter wallet addresses (one per line or comma-separated)
                </p>
                <textarea
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                  placeholder="0x123...&#10;0x456...&#10;0x789..."
                  className="w-full h-40 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                />
                <Button
                  onClick={handleWhitelist}
                  isLoading={isLoading}
                  className="mt-4 w-full"
                  disabled={!whitelistInput.trim()}
                >
                  Add to Whitelist
                </Button>
              </Card>
            )}

            {/* Fund Tab */}
            {activeTab === "fund" && (
              <Card>
                <h3 className="text-lg font-bold text-white mb-4">Fund Prize Pool</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Add USDC to the prize pool. Make sure you have approved the contract first.
                </p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount in USDC"
                    className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                  />
                  <Button
                    onClick={handleFund}
                    isLoading={isLoading}
                    disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                  >
                    Fund
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Current balance: {formatUSDC(draw.fundedAmount)}
                </p>
              </Card>
            )}

            {/* Actions Tab */}
            {activeTab === "actions" && (
              <div className="space-y-4">
                {draw.status === DrawStatus.Open && (
                  <Card>
                    <h3 className="text-lg font-bold text-white mb-2">Close Draw</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Stop accepting new entries. Users who already entered will still receive their prizes.
                    </p>
                    <Button onClick={handleCloseDraw} isLoading={isLoading} variant="secondary">
                      Close Draw
                    </Button>
                  </Card>
                )}

                {draw.status === DrawStatus.Closed && leftover > 0n && (
                  <Card>
                    <h3 className="text-lg font-bold text-white mb-2">Withdraw Leftover</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Withdraw remaining funds: {formatUSDC(leftover)}
                    </p>
                    <Button onClick={handleWithdraw} isLoading={isLoading}>
                      Withdraw
                    </Button>
                  </Card>
                )}

                {draw.status !== DrawStatus.Cancelled && (
                  <Card variant="bordered" className="border-red-500/30">
                    <h3 className="text-lg font-bold text-red-400 mb-2">Cancel Draw</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Cancel this draw and return remaining funds. Already distributed prizes cannot be recovered.
                    </p>
                    <Button onClick={handleCancel} isLoading={isLoading} variant="danger">
                      Cancel Draw
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <StatusBadge status={draw.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entrants</span>
                  <span className="text-white font-bold">{draw.entrantCount.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiers</span>
                  <span className="text-white font-bold">{draw.tierCount.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Default Prize</span>
                  <span className="text-white font-bold">{formatUSDC(draw.defaultPrize)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-[#FFD700] font-bold">1.</span>
                  <span>Set up tiers and fund the prize pool</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FFD700] font-bold">2.</span>
                  <span>Whitelist eligible participants</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FFD700] font-bold">3.</span>
                  <span>Users enter and get instant VRF result</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FFD700] font-bold">4.</span>
                  <span>Prizes are distributed automatically</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FFD700] font-bold">5.</span>
                  <span>Close draw and withdraw leftover</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
