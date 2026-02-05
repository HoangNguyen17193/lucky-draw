import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const drawId = process.env.DRAW_ID;
  if (!drawId) {
    throw new Error("DRAW_ID not set in environment");
  }

  const defaultPrizeAmount = process.env.DEFAULT_PRIZE_AMOUNT;
  if (!defaultPrizeAmount) {
    throw new Error("DEFAULT_PRIZE_AMOUNT not set in environment (e.g., '1' for 1 USDC)");
  }

  // USDC has 6 decimals
  const decimals = 6;
  const amount = ethers.parseUnits(defaultPrizeAmount, decimals);

  console.log("Setting default prize for draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Default Prize:", defaultPrizeAmount, "USDC");

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  const tx = await luckyDrawManager.setDefaultPrize(drawId, amount);
  console.log("\nTransaction hash:", tx.hash);
  await tx.wait();

  console.log("Default prize configured successfully!");

  // Show updated draw info
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  console.log("\nDraw Info:");
  console.log("  Default Prize:", ethers.formatUnits(drawInfo.defaultPrize, decimals), "USDC");
  console.log("  Entrants:", drawInfo.entrantCount.toString());
  console.log("  Tiers:", drawInfo.tierCount.toString());

  // Calculate max payout
  const maxPayout = await luckyDrawManager.getMaxPayout(drawId);

  console.log("\nFunding Requirements:");
  console.log("  Max Possible Payout:", ethers.formatUnits(maxPayout, decimals), "USDC");
  console.log("  Current Funded:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
