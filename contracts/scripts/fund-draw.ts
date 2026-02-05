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

  const amount = process.env.FUND_AMOUNT;
  if (!amount) {
    throw new Error("FUND_AMOUNT not set in environment (e.g., '20')");
  }

  // USDC has 6 decimals
  const decimals = 6;
  const fundAmount = ethers.parseUnits(amount, decimals);

  console.log("Funding draw:", drawId);
  console.log("Contract:", LUCKY_DRAW_MANAGER);
  console.log("Amount:", amount, "USDC");

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  // Get draw info to find the token address
  const drawInfo = await luckyDrawManager.getDraw(drawId);
  const tokenAddress = drawInfo.token;
  console.log("Token address:", tokenAddress);

  // Get token contract
  const token = await ethers.getContractAt("IERC20", tokenAddress);

  // Check balance
  const [signer] = await ethers.getSigners();
  const balance = await token.balanceOf(signer.address);
  console.log("Your USDC balance:", ethers.formatUnits(balance, decimals));

  if (balance < fundAmount) {
    throw new Error(`Insufficient USDC balance. Need ${amount}, have ${ethers.formatUnits(balance, decimals)}`);
  }

  // Check and set allowance
  const allowance = await token.allowance(signer.address, LUCKY_DRAW_MANAGER);
  if (allowance < fundAmount) {
    console.log("\nApproving tokens...");
    const approveTx = await token.approve(LUCKY_DRAW_MANAGER, fundAmount);
    console.log("Approval tx:", approveTx.hash);
    await approveTx.wait();
    console.log("Tokens approved!");
  }

  // Fund the draw
  console.log("\nFunding draw...");
  const tx = await luckyDrawManager.fundDraw(drawId, fundAmount);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("\nDraw funded successfully!");

  // Show updated draw info
  const updatedDraw = await luckyDrawManager.getDraw(drawId);
  console.log("Total funded amount:", ethers.formatUnits(updatedDraw.fundedAmount, decimals), "USDC");

  // Show required vs funded
  const requiredFunding = await luckyDrawManager.getMaxPayout(drawId);
  console.log("Max possible payout:", ethers.formatUnits(requiredFunding, decimals), "USDC");
  
  if (updatedDraw.fundedAmount >= requiredFunding) {
    console.log("\n✓ Draw is fully funded and ready to close entries!");
  } else {
    const remaining = requiredFunding - updatedDraw.fundedAmount;
    console.log("\n⚠ Still need", ethers.formatUnits(remaining, decimals), "more USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
