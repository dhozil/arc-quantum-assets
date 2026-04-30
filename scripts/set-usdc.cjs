const hre = require("hardhat");

async function main() {
  const MARKETPLACE_ADDRESS = "0xEdD654301aB1fa591b4d502E18A7275cC3863896";
  // Use deployed SimpleToken as mock USDC for testing
  const USDC_ADDRESS = "0x0A5222d502afFc8a86aBC84802b4021a6464C63f"; 

  console.log("Setting USDC token address in Marketplace...");

  const marketplace = await hre.ethers.getContractAt("QuantumMarketplace", MARKETPLACE_ADDRESS);
  
  const tx = await marketplace.setUSDCToken(USDC_ADDRESS, {
    gasLimit: 3000000,
    maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("50", "gwei")
  });

  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  
  console.log("USDC token set successfully!");
  console.log(`USDC Address: ${USDC_ADDRESS}`);
  console.log(`Marketplace Address: ${MARKETPLACE_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
