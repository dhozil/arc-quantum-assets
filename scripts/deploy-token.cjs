const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleToken to Arc testnet...");

  const SimpleToken = await hre.ethers.getContractFactory("SimpleToken");
  const token = await SimpleToken.deploy({
    gasLimit: 3000000,
    maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("50", "gwei")
  });

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("SimpleToken deployed to:", tokenAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_TEST_TOKEN=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
