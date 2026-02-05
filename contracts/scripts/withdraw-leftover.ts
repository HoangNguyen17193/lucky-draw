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

  // Recipient address (defaults to signer)
  const [signer] = await ethers.getSigners();
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;

  console.log("Withdrawing leftover from draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Recipient:", recipient);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  
  // Check draw status (4 = Finalized)
  const statusNames = ["Open", "EntriesClosed", "RandomnessRequested", "Finalized", "Cancelled"];
  console.log("\nDraw status:", statusNames[Number(drawInfo.status)]);

  if (Number(drawInfo.status) !== 3) {
    throw new Error("Draw must be Finalized to withdraw leftover");
  }

  const leftover = drawInfo.fundedAmount - drawInfo.totalDistributed;
  console.log("Funded amount:", ethers.formatEther(drawInfo.fundedAmount), "tokens");
  console.log("Distributed:", ethers.formatEther(drawInfo.totalDistributed), "tokens");
  console.log("Leftover:", ethers.formatEther(leftover), "tokens");

  if (leftover === 0n) {
    console.log("\nNo leftover to withdraw!");
    return;
  }

  console.log("\nWithdrawing leftover...");
  const tx = await luckyDrawManager.withdrawLeftover(drawId, recipient);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("\nLeftover withdrawn successfully!");
  console.log("Amount:", ethers.formatEther(leftover), "tokens sent to", recipient);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
