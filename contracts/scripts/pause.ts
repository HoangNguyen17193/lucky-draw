import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  // Set ACTION=unpause to unpause, default is pause
  const action = process.env.ACTION || "pause";

  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Action:", action.toUpperCase());

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  if (action === "unpause") {
    const tx = await luckyDrawManager.unpause();
    console.log("\nTransaction hash:", tx.hash);
    await tx.wait();
    console.log("Contract UNPAUSED successfully!");
  } else {
    const tx = await luckyDrawManager.pause();
    console.log("\nTransaction hash:", tx.hash);
    await tx.wait();
    console.log("Contract PAUSED successfully!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
