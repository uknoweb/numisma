const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("\n💰 Wallet Info:");
  console.log("   Address:", signer.address);
  console.log("   Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("   Network:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  console.log("\n🔗 View on Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${signer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
