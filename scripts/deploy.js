import hre from "hardhat";

async function main() {
  console.log("Deploying QuantumRWA and QuantumFactory contracts to Arc Testnet...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy QuantumRWA
  console.log("\nDeploying QuantumRWA...");
  const QuantumRWA = await hre.ethers.getContractFactory("QuantumRWA");
  const quantumRWA = await QuantumRWA.deploy(
    "Quantum Treasury Bond",
    "QT-BOND",
    "Quantum Treasury Bond Token",
    "TREASURY",
    hre.ethers.parseUnits("1000000", 6), // 1M USDC
    520, // 5.2% APY in basis points
    0, // No maturity date
    hre.ethers.parseUnits("10000000", 18) // 10M max supply
  );
  await quantumRWA.waitForDeployment();
  const rwaAddress = await quantumRWA.getAddress();
  console.log("QuantumRWA deployed to:", rwaAddress);

  // Deploy QuantumFactory
  console.log("\nDeploying QuantumFactory...");
  const QuantumFactory = await hre.ethers.getContractFactory("QuantumFactory");
  const quantumFactory = await QuantumFactory.deploy();
  await quantumFactory.waitForDeployment();
  const factoryAddress = await quantumFactory.getAddress();
  console.log("QuantumFactory deployed to:", factoryAddress);

  // Mint some tokens to the deployer
  console.log("\nMinting initial tokens to deployer...");
  const mintAmount = hre.ethers.parseUnits("1000", 18);
  await quantumRWA.mint(deployer.address, mintAmount);
  console.log("Minted 1000 QT-BOND to:", deployer.address);

  console.log("\n=== Deployment Summary ===");
  console.log("QuantumRWA:", rwaAddress);
  console.log("QuantumFactory:", factoryAddress);
  console.log("\nAdd these addresses to your frontend .env file:");
  console.log(`NEXT_PUBLIC_RWA_CONTRACT=${rwaAddress}`);
  console.log(`NEXT_PUBLIC_FACTORY_CONTRACT=${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
