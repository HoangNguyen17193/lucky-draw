"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { ConnectButton } from "@/components/ConnectButton";
import { useNextDrawId, useDraw, useContractOwner } from "@/hooks/useDraw";
import { DrawStatus, DrawStatusLabels, Draw } from "@/types/draw";
import { formatUnits } from "viem";

const STATUS_COLORS: Record<DrawStatus, string> = {
  [DrawStatus.Open]: "bg-green-500",
  [DrawStatus.Closed]: "bg-yellow-500",
  [DrawStatus.Cancelled]: "bg-red-500",
};

function DrawRow({ drawId }: { drawId: number }) {
  const { data: draw, isLoading } = useDraw(BigInt(drawId));

  if (isLoading || !draw) {
    return (
      <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-20" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-16" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-12" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-20" /></td>
      </tr>
    );
  }

  const typedDraw = draw as Draw;

  return (
    <tr className="border-b border-white/10 hover:bg-white/5">
      <td className="px-6 py-4 font-medium text-white">#{drawId}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${STATUS_COLORS[typedDraw.status]}`}>
          {DrawStatusLabels[typedDraw.status]}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-300">
        {formatUnits(typedDraw.fundedAmount, 6)} USDC
      </td>
      <td className="px-6 py-4 text-gray-300">
        {typedDraw.entrantCount.toString()}
      </td>
      <td className="px-6 py-4 text-gray-300">
        {typedDraw.tierCount.toString()} tiers
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/admin/draw/${drawId}`}
          className="text-[#FFD700] hover:underline font-medium"
        >
          Manage →
        </Link>
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { authenticated, user } = usePrivy();
  const { data: nextDrawId, isLoading: drawsLoading } = useNextDrawId();
  const { data: owner } = useContractOwner();

  const userAddress = user?.wallet?.address?.toLowerCase();
  const isOwner = owner && userAddress && owner.toLowerCase() === userAddress;

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-12">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to access admin features</p>
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
          <p className="text-gray-400 mb-4">You are not the contract owner</p>
          <p className="text-sm text-gray-500">
            Connected: {userAddress?.slice(0, 10)}...
          </p>
          <p className="text-sm text-gray-500">
            Owner: {owner.slice(0, 10)}...
          </p>
          <Link href="/" className="mt-8 inline-block text-[#FFD700] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const drawIds = nextDrawId ? Array.from({ length: Number(nextDrawId) }, (_, i) => i) : [];

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
              Admin
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage draws, tiers, and whitelist</p>
          </div>

          <Link
            href="/admin/create"
            className="px-6 py-3 rounded-xl btn-gradient text-black font-bold uppercase tracking-wide inline-flex items-center gap-2"
          >
            <span>+</span> Create Draw
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Total Draws</div>
            <div className="text-3xl font-bold text-white">
              {drawsLoading ? "..." : nextDrawId?.toString() || "0"}
            </div>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Active Draws</div>
            <div className="text-3xl font-bold text-green-400">
              {drawsLoading ? "..." : "-"}
            </div>
          </div>
          <div className="glass rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Contract</div>
            <div className="text-sm font-mono text-gray-300">
              {owner ? `${owner.slice(0, 10)}...${owner.slice(-8)}` : "..."}
            </div>
          </div>
        </div>

        {/* Draws table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">All Draws</h2>
          </div>

          {drawsLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading draws...</p>
            </div>
          ) : drawIds.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">No draws created yet</p>
              <Link
                href="/admin/create"
                className="text-[#FFD700] hover:underline"
              >
                Create your first draw →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Funded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Entrants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tiers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drawIds.reverse().map((id) => (
                    <DrawRow key={id} drawId={id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
