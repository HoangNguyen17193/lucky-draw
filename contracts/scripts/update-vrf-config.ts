import { ethers, network } from "hardhat";

type SupportedNetwork = "sepolia" | "saigon";

type VrfNetworkConfig = {
  label: string;
  keyHash: string;
  subscriptionEnvKey: "VRF_SUBSCRIPTION_ID" | "SAIGON_VRF_SUBSCRIPTION_ID";
};

const NETWORK_CONFIG: Record<SupportedNetwork, VrfNetworkConfig> = {
  sepolia: {
    label: "Sepolia",
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subscriptionEnvKey: "VRF_SUBSCRIPTION_ID",
  },
  saigon: {
    label: "Ronin Saigon",
    keyHash: "0x0a79a60cc054d8da06a5050a1d07f0fec08088ca64192cf67477f8cc3e549f71",
    subscriptionEnvKey: "SAIGON_VRF_SUBSCRIPTION_ID",
  },
};

const DEFAULT_CALLBACK_GAS_LIMIT = 2_500_000;
const DEFAULT_REQUEST_CONFIRMATIONS = 3;
const DEFAULT_NATIVE_PAYMENT = false;

const LUCKY_DRAW_MANAGER = process.env.LUCKY_DRAW_MANAGER_ADDRESS || "";

function getNumberEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  return parsed;
}

function getBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

async function main() {
  if (!LUCKY_DRAW_MANAGER) {
    throw new Error("LUCKY_DRAW_MANAGER_ADDRESS not set in environment");
  }

  const selectedNetwork = network.name as SupportedNetwork;
  const config = NETWORK_CONFIG[selectedNetwork];

  if (!config) {
    throw new Error(`Unsupported network "${network.name}". Supported networks: ${Object.keys(NETWORK_CONFIG).join(", ")}`);
  }

  const subscriptionId = process.env[config.subscriptionEnvKey];
  if (!subscriptionId) {
    throw new Error(`${config.subscriptionEnvKey} not set in environment`);
  }

  const keyHash = process.env.VRF_KEY_HASH || config.keyHash;
  const callbackGasLimit = getNumberEnv("VRF_CALLBACK_GAS_LIMIT", DEFAULT_CALLBACK_GAS_LIMIT);
  const requestConfirmations = getNumberEnv("VRF_REQUEST_CONFIRMATIONS", DEFAULT_REQUEST_CONFIRMATIONS);
  const nativePayment = getBooleanEnv("VRF_NATIVE_PAYMENT", DEFAULT_NATIVE_PAYMENT);

  console.log("Updating VRF config on:", LUCKY_DRAW_MANAGER);
  console.log("Subscription ID:", subscriptionId);
  console.log("Network:", config.label);
  console.log("Key Hash:", keyHash);
  console.log("Callback Gas Limit:", callbackGasLimit);
  console.log("Request Confirmations:", requestConfirmations);
  console.log("Native Payment:", nativePayment);

  const luckyDrawManager = await ethers.getContractAt("LuckyDrawManager", LUCKY_DRAW_MANAGER);
  const tx = await luckyDrawManager.updateVRFConfig(
    subscriptionId,
    keyHash,
    callbackGasLimit,
    requestConfirmations,
    nativePayment
  );

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("VRF config updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
