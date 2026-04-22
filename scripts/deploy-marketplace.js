import hre from "hardhat";

async function main() {
  console.log("Deploying QuantumMarketplace contract to Arc Testnet...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy QuantumMarketplace
  console.log("\nDeploying QuantumMarketplace...");
  const QuantumMarketplace = await hre.ethers.getContractFactory("QuantumMarketplace");
  const marketplace = await QuantumMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("QuantumMarketplace deployed to:", marketplaceAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("QuantumMarketplace:", marketplaceAddress);
  console.log("\nAdd this address to your frontend .env file:");
  console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT=${marketplaceAddress}`);
  console.log("\nNote: Set the USDC token address later using setUSDCToken()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
