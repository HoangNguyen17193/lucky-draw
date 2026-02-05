import { ethers } from "hardhat";

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  // Configure addresses to whitelist here
  const addressesToWhitelist = [
    // "0x1234567890123456789012345678901234567890",
    // "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  ];

  // Or read from environment variable (comma-separated)
  const envAddresses = process.env.WHITELIST_ADDRESSES;
  if (envAddresses) {
    const parsed = envAddresses.split(",").map((addr) => addr.trim());
    addressesToWhitelist.push(...parsed);
  }

  if (addressesToWhitelist.length === 0) {
    throw new Error("No addresses to whitelist. Set WHITELIST_ADDRESSES env var or edit the script.");
  }

  // Set to true to whitelist, false to remove from whitelist
  const allowed = process.env.WHITELIST_ALLOWED !== "false";

  console.log("Managing whitelist on contract:", LUCKY_DRAW_MANAGER);
  console.log("Action:", allowed ? "WHITELIST" : "REMOVE FROM WHITELIST");
  console.log("Addresses:", addressesToWhitelist.length);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);

  if (addressesToWhitelist.length === 1) {
    console.log("\nWhitelisting single address:", addressesToWhitelist[0]);
    const tx = await luckyDrawManager.setWhitelist(addressesToWhitelist[0], allowed);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
  } else {
    console.log("\nBatch whitelisting addresses:");
    addressesToWhitelist.forEach((addr, i) => console.log(`  ${i + 1}. ${addr}`));
    const tx = await luckyDrawManager.setWhitelistBatch(addressesToWhitelist, allowed);
    console.log("\nTransaction hash:", tx.hash);
    await tx.wait();
  }

  console.log("\nWhitelist updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
