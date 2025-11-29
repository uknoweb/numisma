import { ethers } from "hardhat";

async function main() {
  const address = "0x8b579F6d6836ec0916d0d22d2B2a9f7c5E445C8A";
  
  console.log("🔍 Checking balance...\n");
  console.log("📍 Address:", address);
  
  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log("💰 Balance:", balanceInEth, "ETH");
  
  if (parseFloat(balanceInEth) === 0) {
    console.log("\n⚠️  No funds! Get testnet ETH from:");
    console.log("   https://faucet.worldchain.org");
  } else {
    console.log("\n✅ Wallet funded! Ready to deploy.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
