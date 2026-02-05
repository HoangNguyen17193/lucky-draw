import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";
const decimals = 6; // USDC

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const drawId = process.env.DRAW_ID;
  if (!drawId) {
    throw new Error("DRAW_ID not set in environment");
  }

  console.log("Closing draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info first
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  const statusNames = ["Open", "Closed", "Cancelled"];
  
  console.log("\nDraw Info:");
  console.log("  Status:", statusNames[Number(drawInfo.status)]);
  console.log("  Entrants:", drawInfo.entrantCount.toString());
  console.log("  Tiers:", drawInfo.tierCount.toString());
  console.log("  Funded:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
  console.log("  Distributed:", ethers.formatUnits(drawInfo.totalDistributed, decimals), "USDC");

  if (Number(drawInfo.status) !== 0) {
    throw new Error("Draw must be Open to close it");
  }

  console.log("\nClosing draw...");
  const tx = await luckyDrawManager.closeDraw(drawId);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("\n✓ Draw closed successfully!");
  console.log("No more entries will be accepted.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
