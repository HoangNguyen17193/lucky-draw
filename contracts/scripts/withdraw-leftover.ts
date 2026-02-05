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

  // Recipient address (defaults to signer)
  const [signer] = await ethers.getSigners();
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;

  console.log("Withdrawing leftover from draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Recipient:", recipient);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  
  // Check draw status (1 = Closed)
  const statusNames = ["Open", "Closed", "Cancelled"];
  console.log("\nDraw status:", statusNames[Number(drawInfo.status)]);

  if (Number(drawInfo.status) !== 1) {
    throw new Error("Draw must be Closed to withdraw leftover");
  }

  const leftover = drawInfo.fundedAmount - drawInfo.totalDistributed;
  console.log("Funded amount:", ethers.formatUnits(drawInfo.fundedAmount, decimals), "USDC");
  console.log("Distributed:", ethers.formatUnits(drawInfo.totalDistributed, decimals), "USDC");
  console.log("Leftover:", ethers.formatUnits(leftover, decimals), "USDC");

  if (leftover <= 0n) {
    console.log("\nNo leftover to withdraw!");
    return;
  }

  console.log("\nWithdrawing leftover...");
  const tx = await luckyDrawManager.withdrawLeftover(drawId, recipient);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("\nLeftover withdrawn successfully!");
  console.log("Amount:", ethers.formatUnits(leftover, decimals), "USDC sent to", recipient);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
