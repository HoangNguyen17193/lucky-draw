import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const tokenAddress = process.env.TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error("TOKEN_ADDRESS not set in environment");
  }

  console.log("Creating new draw...");
  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Token:", tokenAddress);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  const tx = await luckyDrawManager.createDraw(tokenAddress);
  console.log("\nTransaction hash:", tx.hash);
  const receipt = await tx.wait();

  // Parse event to get draw ID
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = luckyDrawManager.interface.parseLog(log);
      return parsed?.name === "DrawCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = luckyDrawManager.interface.parseLog(event);
    console.log("\n========================================");
    console.log("Draw created successfully!");
    console.log("Draw ID:", parsed?.args.drawId.toString());
    console.log("========================================");
  } else {
    console.log("\nDraw created! Check transaction for draw ID.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
