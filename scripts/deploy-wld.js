const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🪙 Deploying MockWLD token for testing...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockWLD
  console.log("⏳ Deploying MockWLD...");
  const MockWLD = await hre.ethers.getContractFactory("MockWLD");
  const wld = await MockWLD.deploy();

  await wld.waitForDeployment();
  const wldAddress = await wld.getAddress();

  console.log("✅ MockWLD deployed to:", wldAddress);

  // Get token info
  const name = await wld.name();
  const symbol = await wld.symbol();
  const decimals = await wld.decimals();
  const totalSupply = await wld.totalSupply();
  const deployerBalance = await wld.balanceOf(deployer.address);

  console.log("\n📊 Token Info:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", Number(decimals));
  console.log("   Total Supply:", hre.ethers.formatEther(totalSupply), symbol);
  console.log("   Deployer Balance:", hre.ethers.formatEther(deployerBalance), symbol);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: wldAddress,
    deployer: deployer.address,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: totalSupply.toString(),
    deployerBalance: deployerBalance.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    isMock: true,
    note: "This is a MOCK token for testing only. DO NOT use in mainnet."
  };

  const deploymentPath = "./deployment-wld.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_WLD_TOKEN_ADDRESS=${wldAddress}`);
  
  console.log("\n2. Deploy PoolV2 with this WLD address:");
  console.log("   npm run deploy:pool-v2");

  console.log("\n3. Users can get test WLD:");
  console.log("   Call faucet() function to get 1000 WLD");

  console.log("\n🔗 Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${wldAddress}`);

  console.log("\n⚠️  IMPORTANT:");
  console.log("   - This is a MOCK token for TESTING ONLY");
  console.log("   - In mainnet, use the official WLD token address");
  console.log("   - Faucet function allows anyone to mint tokens (testing only)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
