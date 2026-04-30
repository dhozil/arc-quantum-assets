const hre = require("hardhat");

async function main() {
  console.log("Deploying QuantumEscrow to Arc testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy QuantumEscrow
  const QuantumEscrow = await hre.ethers.getContractFactory("QuantumEscrow");
  const escrow = await QuantumEscrow.deploy({
    gasLimit: 5000000,
    maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
  });

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("QuantumEscrow deployed to:", escrowAddress);

  // Set USDC token address (Arc testnet USDC)
  // TODO: Replace with actual Arc testnet USDC address
  const usdcAddress = "0x..."; // Arc testnet USDC address
  console.log("Setting USDC token address to:", usdcAddress);
  
  // Uncomment after getting actual USDC address
  // await escrow.setUSDCToken(usdcAddress);
  // console.log("USDC token address set successfully");

  console.log("\nDeployment completed!");
  console.log("Escrow Contract Address:", escrowAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_ESCROW_CONTRACT=${escrowAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
