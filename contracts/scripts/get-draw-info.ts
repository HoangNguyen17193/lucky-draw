import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

const STATUS_LABELS = ["Open", "Closed", "Cancelled"];

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
  console.log("Available Funds:", ethers.formatUnits(drawInfo.fundedAmount - drawInfo.totalDistributed, decimals), "USDC");
  console.log("Default Prize:", drawInfo.defaultPrize > 0n ? ethers.formatUnits(drawInfo.defaultPrize, decimals) + " USDC" : "not set");
  console.log("Entrant Count:", drawInfo.entrantCount.toString());
  console.log("Tier Count:", drawInfo.tierCount.toString());

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

  // Leftover info
  const leftover = drawInfo.fundedAmount - drawInfo.totalDistributed;
  if (leftover > 0n) {
    console.log("\n--- Leftover ---");
    console.log("Leftover:", ethers.formatUnits(leftover, decimals), "USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
