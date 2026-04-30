const hre = require("hardhat");

async function main() {
  console.log("Deploying QuantumVault to Arc testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy QuantumVault
  const QuantumVault = await hre.ethers.getContractFactory("QuantumVault");
  const vault = await QuantumVault.deploy({
    gasLimit: 5000000,
    maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
  });

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("QuantumVault deployed to:", vaultAddress);

  // Set USDC token address (Arc testnet USDC)
  // TODO: Replace with actual Arc testnet USDC address
  const usdcAddress = "0x..."; // Arc testnet USDC address
  console.log("Setting USDC token address to:", usdcAddress);
  
  // Uncomment after getting actual USDC address
  // await vault.setUSDCToken(usdcAddress);
  // console.log("USDC token address set successfully");

  console.log("\nDeployment completed!");
  console.log("Vault Contract Address:", vaultAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_VAULT_CONTRACT=${vaultAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
