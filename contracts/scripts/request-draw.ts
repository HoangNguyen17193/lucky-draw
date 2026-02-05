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

  console.log("Getting draw info:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  const statusNames = ["Open", "Closed", "Cancelled"];
  
  console.log("\n========================================");
  console.log("Draw #" + drawId);
  console.log("========================================");
  console.log("Status:", statusNames[Number(drawInfo.status)]);
  console.log("Token:", drawInfo.token);
  console.log("Funded:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
  console.log("Distributed:", ethers.formatUnits(drawInfo.totalDistributed, decimals), "USDC");
  console.log("Entrants:", drawInfo.entrantCount.toString());
  console.log("Tiers:", drawInfo.tierCount.toString());
  console.log("Default Prize:", ethers.formatUnits(drawInfo.defaultPrize, decimals), "USDC");

  console.log("\nNote: In this contract design, VRF is requested per-user when they enter.");
  console.log("There is no separate requestDraw() function.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
