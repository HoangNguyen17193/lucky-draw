import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";
const BASIS_POINTS = 10000n; // 100% = 10000

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const drawId = process.env.DRAW_ID;
  if (!drawId) {
    throw new Error("DRAW_ID not set in environment");
  }

  // USDC has 6 decimals
  const decimals = 6;

  // ============================================================
  // CONFIGURE YOUR TIERS HERE
  // ============================================================
  // - prizeAmount: Fixed prize amount for winners of this tier
  // - winProbability: Chance to win (in basis points: 10000 = 100%)
  //
  // Example with 100 participants:
  // - Tier 1: 50 USDC, 5% chance   -> ~5 winners
  // - Tier 2: 10 USDC, 15% chance  -> ~15 winners
  // - Tier 3: 3 USDC, 30% chance   -> ~30 winners
  // - Remaining 50% get default prize
  //
  // NOTE: Total tier probabilities can be less than 100%
  //       The remainder gets the default prize
  // ============================================================
  
  const tiers = [
    { 
      prizeAmount: ethers.parseUnits("50", decimals),  // 50 USDC
      winProbability: 100n,  // 1% chance
    },
    { 
      prizeAmount: ethers.parseUnits("10", decimals),  // 10 USDC
      winProbability: 500n,  // 5% chance
    },
    { 
      prizeAmount: ethers.parseUnits("5", decimals),  // 5 USDC
      winProbability: 1500n,  // 15% chance
    },
    { 
      prizeAmount: ethers.parseUnits("3", decimals),   // 3 USDC
      winProbability: 3000n,  // 30% chance
    },
  ];

  // Validate total <= 100%
  const total = tiers.reduce((sum, t) => sum + t.winProbability, 0n);
  if (total > BASIS_POINTS) {
    throw new Error(`Total probability cannot exceed 100% (10000 basis points). Got: ${total}`);
  }

  console.log("Setting up probability-based tiers for draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  console.log("\nTiers to configure:");
  tiers.forEach((tier, i) => {
    const prob = Number(tier.winProbability) / 100;
    const prize = ethers.formatUnits(tier.prizeAmount, decimals);
    console.log(`  Tier ${i + 1}: ${prize} USDC | ${prob}% win chance`);
  });

  const remainingProbability = Number(BASIS_POINTS - total) / 100;
  console.log(`\n  Remaining ${remainingProbability}% will receive default prize`);

  const tx = await luckyDrawManager.setTiers(drawId, tiers);
  console.log("\nTransaction hash:", tx.hash);
  await tx.wait();

  console.log("Tiers configured successfully!");

  // Display current draw info
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  console.log("\nDraw info:");
  console.log("  Entrants:", drawInfo.entrantCount.toString());
  console.log("  Current funding:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
  console.log("  Default prize:", ethers.formatUnits(drawInfo.defaultPrize, decimals), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
