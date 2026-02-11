import { ethers, run, network } from "hardhat";

type SupportedNetwork = "sepolia" | "saigon" | "ronin";

type VrfConfig = {
  label: string;
  coordinator: string;
  keyHash: string;
  subscriptionEnvKey: "VRF_SUBSCRIPTION_ID" | "SAIGON_VRF_SUBSCRIPTION_ID" | "RONIN_VRF_SUBSCRIPTION_ID";
  nativePayment?: boolean;
  vrfPortalUrl?: (subscriptionId: string) => string;
};

const NETWORK_CONFIG: Record<SupportedNetwork, VrfConfig> = {
  sepolia: {
    label: "Sepolia",
    coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subscriptionEnvKey: "VRF_SUBSCRIPTION_ID",
    nativePayment: false,
    vrfPortalUrl: (subscriptionId) => `https://vrf.chain.link/sepolia/${subscriptionId}`,
  },
  saigon: {
    label: "Ronin Saigon",
    coordinator: "0xc052324E6A27D0E4b2CbF0FdFFBCb3796ea8f8B8",
    keyHash: "0x0a79a60cc054d8da06a5050a1d07f0fec08088ca64192cf67477f8cc3e549f71",
    subscriptionEnvKey: "SAIGON_VRF_SUBSCRIPTION_ID",
    nativePayment: false,
  },
  ronin: {
    label: "Ronin Mainnet",
    coordinator: "0xa18FD3db9B869AD2A8c55267e0D54dbf6ECEbEda",
    keyHash: "0x1aefc70f3533a251306d6b85a6b336ba0ae2e384226274b236f42c3d5366dbbd",
    subscriptionEnvKey: "RONIN_VRF_SUBSCRIPTION_ID",
    nativePayment: true,
  },
};

const CALLBACK_GAS_LIMIT = parseInt(process.env.VRF_CALLBACK_GAS_LIMIT || "2500000", 10);
const REQUEST_CONFIRMATIONS = parseInt(process.env.VRF_REQUEST_CONFIRMATIONS || "3", 10);
const ENV_NATIVE_PAYMENT = process.env.VRF_NATIVE_PAYMENT;

async function main() {
  const selectedNetwork = network.name as SupportedNetwork;
  const config = NETWORK_CONFIG[selectedNetwork];

  if (!config) {
    throw new Error(`Unsupported network "${network.name}". Supported networks: ${Object.keys(NETWORK_CONFIG).join(", ")}`);
  }

  const subscriptionId = process.env[config.subscriptionEnvKey];
  if (!subscriptionId) {
    throw new Error(`${config.subscriptionEnvKey} not set in environment`);
  }

  const nativePayment = ENV_NATIVE_PAYMENT
    ? ENV_NATIVE_PAYMENT.toLowerCase() === "true"
    : config.nativePayment ?? false;

  console.log(`Deploying LuckyDrawManager to ${config.label}...`);
  console.log("  VRF Coordinator:", config.coordinator);
  console.log("  Subscription ID:", subscriptionId);
  console.log("  Native Payment:", nativePayment);
  console.log("  Callback Gas Limit:", CALLBACK_GAS_LIMIT);
  console.log("  Request Confirmations:", REQUEST_CONFIRMATIONS);

  const LuckyDrawManager = await ethers.getContractFactory("LuckyDrawManager");
  const luckyDrawManager = await LuckyDrawManager.deploy(
    config.coordinator,
    subscriptionId,
    config.keyHash,
    CALLBACK_GAS_LIMIT,
    REQUEST_CONFIRMATIONS,
    nativePayment
  );

  await luckyDrawManager.waitForDeployment();
  const address = await luckyDrawManager.getAddress();

  console.log("\n========================================");
  console.log("LuckyDrawManager deployed to:", address);
  console.log("========================================\n");

  console.log("IMPORTANT: Add this contract as a consumer to your VRF subscription at:");
  if (config.vrfPortalUrl) {
    console.log(config.vrfPortalUrl(subscriptionId));
  } else {
    console.log(`VRF Portal for ${config.label}: please add consumer manually`);
  }

  // Verify on Etherscan if not on localhost
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await luckyDrawManager.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [
          config.coordinator,
          subscriptionId,
          config.keyHash,
          CALLBACK_GAS_LIMIT,
          REQUEST_CONFIRMATIONS,
          nativePayment,
        ],
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
