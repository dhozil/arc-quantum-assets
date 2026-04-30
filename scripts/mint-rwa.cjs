const hre = require("hardhat");

async function main() {
  const USDC_ADDRESS = "0x0A5222d502afFc8a86aBC84802b4021a6464C63f";
  const USER_ADDRESS = "0x0266FeB4337E7faf71E668745e9EAeaF26Bb31ea";
  const MINT_AMOUNT = "10000000000000000000000000"; // 10,000,000 tokens (18 decimals)

  console.log("Minting USDC tokens to user wallet...");

  const usdc = await hre.ethers.getContractAt("SimpleToken", USDC_ADDRESS);
  
  const tx = await usdc.mint(USER_ADDRESS, MINT_AMOUNT, {
    gasLimit: 3000000,
    maxFeePerGas: hre.ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("50", "gwei")
  });

  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  
  console.log("Tokens minted successfully!");
  console.log(`Minted ${MINT_AMOUNT} tokens to ${USER_ADDRESS}`);
  console.log("\nUSDC Address:", USDC_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
