import { ethers, run, network } from "hardhat";

async function main() {
  console.log("Deploying TestToken...");

  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();

  await testToken.waitForDeployment();
  const address = await testToken.getAddress();

  console.log("\n========================================");
  console.log("TestToken deployed to:", address);
  console.log("========================================\n");

  // Verify on Etherscan if not on localhost
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations before verification...");
    await testToken.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified!");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
