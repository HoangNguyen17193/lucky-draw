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

  console.log("Closing entries for draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info first
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  console.log("\nDraw Info:");
  console.log("  Entrants:", drawInfo.entrantCount.toString());
  console.log("  Tiers:", drawInfo.tierCount.toString());
  console.log("  Funded:", ethers.formatEther(drawInfo.fundedAmount), "tokens");

  const requiredFunding = await luckyDrawManager.getMaxPayout(drawId);
  console.log("  Max possible payout:", ethers.formatEther(requiredFunding), "tokens");

  if (drawInfo.fundedAmount < requiredFunding) {
    throw new Error("Insufficient funding! Fund the draw before closing entries.");
  }

  if (drawInfo.entrantCount < drawInfo.tierCount) {
    throw new Error(`Not enough entrants! Need at least ${drawInfo.tierCount} entrants for ${drawInfo.tierCount} tiers.`);
  }

  console.log("\nClosing entries...");
  const tx = await luckyDrawManager.closeEntries(drawId);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("\n✓ Entries closed successfully!");
  console.log("Anyone can now call requestDraw() to trigger the VRF randomness.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
