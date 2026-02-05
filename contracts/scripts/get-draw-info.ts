import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

const STATUS_LABELS = ["Open", "EntriesClosed", "RandomnessRequested", "Finalized", "Cancelled"];

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const drawId = process.env.DRAW_ID;
  if (!drawId) {
    throw new Error("DRAW_ID not set in environment");
  }

  const decimals = 6; // USDC

  console.log("Getting draw info for draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  const drawInfo = await luckyDrawManager.getDraw(drawId);
  
  console.log("\n========================================");
  console.log("Draw #" + drawId);
  console.log("========================================");
  console.log("Status:", STATUS_LABELS[Number(drawInfo.status)]);
  console.log("Token:", drawInfo.token);
  console.log("Funded Amount:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
  console.log("Total Distributed:", ethers.formatUnits(drawInfo.totalDistributed, decimals), "USDC");
  console.log("Default Prize:", drawInfo.defaultPrize > 0n ? ethers.formatUnits(drawInfo.defaultPrize, decimals) + " USDC" : "disabled");
  console.log("Entrant Count:", drawInfo.entrantCount.toString());
  console.log("Tier Count:", drawInfo.tierCount.toString());

  if (drawInfo.requestId > 0n) {
    console.log("VRF Request ID:", drawInfo.requestId.toString());
  }

  // Show tier details
  if (drawInfo.tierCount > 0n) {
    console.log("\n--- Tiers (Probability-Based) ---");
    
    let totalProbability = 0n;
    for (let i = 0; i < Number(drawInfo.tierCount); i++) {
      const tier = await luckyDrawManager.getTier(drawId, i);
      const prob = Number(tier.winProbability) / 100;
      totalProbability += tier.winProbability;
      
      console.log(`Tier ${i + 1}:`);
      console.log(`  Prize: ${ethers.formatUnits(tier.prizeAmount, decimals)} USDC`);
      console.log(`  Win Probability: ${prob}%`);
      
      if (tier.winnersCount > 0n) {
        console.log(`  Winners: ${tier.winnersCount.toString()}`);
        console.log(`  Total Paid: ${ethers.formatUnits(tier.totalPaid, decimals)} USDC`);
      }
    }
    
    const remainingProb = 10000n - totalProbability;
    console.log(`\nDefault Prize Probability: ${Number(remainingProb) / 100}%`);
  }

  // Show expected payouts if entrants exist
  if (drawInfo.entrantCount > 0n && drawInfo.tierCount > 0n) {
    console.log("\n--- Expected Payouts ---");
    const [expectedTotal, expectedPerTier, expectedDefault] = await luckyDrawManager.getExpectedPayout(drawId);
    
    for (let i = 0; i < Number(drawInfo.tierCount); i++) {
      const tier = await luckyDrawManager.getTier(drawId, i);
      const expectedWinners = (Number(drawInfo.entrantCount) * Number(tier.winProbability)) / 10000;
      console.log(`Tier ${i + 1}: ~${expectedWinners.toFixed(1)} winners = ${ethers.formatUnits(expectedPerTier[i], decimals)} USDC`);
    }
    console.log(`Default: ${ethers.formatUnits(expectedDefault, decimals)} USDC`);
    console.log(`Total Expected: ${ethers.formatUnits(expectedTotal, decimals)} USDC`);
    
    const maxPayout = await luckyDrawManager.getMaxPayout(drawId);
    console.log(`Max Possible (worst case): ${ethers.formatUnits(maxPayout, decimals)} USDC`);
  }

  // Show winners if finalized
  if (drawInfo.status === 3n) { // Finalized
    const winnersCount = await luckyDrawManager.getWinnersCount(drawId);
    console.log("\n--- Winners ---");
    console.log("Total winners:", winnersCount.toString());
    
    if (winnersCount > 0n && winnersCount <= 50n) {
      const winners = await luckyDrawManager.getWinners(drawId);
      
      // Group by tier
      const tierWinners: { [key: string]: { address: string; amount: string }[] } = {};
      const defaultWinners: { address: string; amount: string }[] = [];
      
      for (const winner of winners) {
        const amount = ethers.formatUnits(winner.amount, decimals);
        if (winner.tierIndex === ethers.MaxUint256) {
          defaultWinners.push({ address: winner.winner, amount });
        } else {
          const tierKey = `Tier ${Number(winner.tierIndex) + 1}`;
          if (!tierWinners[tierKey]) tierWinners[tierKey] = [];
          tierWinners[tierKey].push({ address: winner.winner, amount });
        }
      }
      
      // Print by tier
      for (const [tier, winners] of Object.entries(tierWinners)) {
        console.log(`\n${tier} (${winners.length} winners):`);
        for (const w of winners) {
          console.log(`  ${w.address}: ${w.amount} USDC`);
        }
      }
      
      if (defaultWinners.length > 0) {
        console.log(`\nDefault Prize (${defaultWinners.length} recipients):`);
        for (const w of defaultWinners) {
          console.log(`  ${w.address}: ${w.amount} USDC`);
        }
      }
    }
    
    // Leftover
    const leftover = drawInfo.fundedAmount - drawInfo.totalDistributed;
    if (leftover > 0n) {
      console.log("\n--- Leftover ---");
      console.log("Leftover:", ethers.formatUnits(leftover, decimals), "USDC");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
