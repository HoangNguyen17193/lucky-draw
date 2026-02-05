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

  console.log("Requesting VRF randomness for draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info first
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  const statusNames = ["Open", "EntriesClosed", "RandomnessRequested", "Finalized", "Cancelled"];
  console.log("\nDraw status:", statusNames[Number(drawInfo.status)]);

  if (Number(drawInfo.status) !== 1) {
    throw new Error("Draw must be in EntriesClosed status to request randomness");
  }

  console.log("\nRequesting randomness from Chainlink VRF...");
  const tx = await luckyDrawManager.requestDraw(drawId);
  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();

  // Parse event to get request ID
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = luckyDrawManager.interface.parseLog(log);
      return parsed?.name === "DrawRequested";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = luckyDrawManager.interface.parseLog(event);
    console.log("\n========================================");
    console.log("VRF Request submitted!");
    console.log("Request ID:", parsed?.args.requestId.toString());
    console.log("========================================");
  }

  console.log("\n⏳ Waiting for Chainlink VRF to fulfill the request...");
  console.log("This typically takes 1-3 blocks. Check the contract for DrawFinalized event.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
