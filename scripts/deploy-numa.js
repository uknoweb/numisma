const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying NumismaToken...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy NumismaToken
  console.log("⏳ Deploying NumismaToken contract...");
  const NumismaToken = await hre.ethers.getContractFactory("NumismaToken");
  const numaToken = await NumismaToken.deploy();
  
  await numaToken.waitForDeployment();
  const numaAddress = await numaToken.getAddress();

  console.log("✅ NumismaToken deployed to:", numaAddress);

  // Get initial info
  const totalSupply = await numaToken.totalSupply();
  const ownerBalance = await numaToken.balanceOf(deployer.address);
  const name = await numaToken.name();
  const symbol = await numaToken.symbol();
  const decimals = await numaToken.decimals();

  console.log("\n📊 Token Info:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", hre.ethers.formatEther(totalSupply), "NUMA");
  console.log("   Owner Balance:", hre.ethers.formatEther(ownerBalance), "NUMA");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: numaAddress,
    deployer: deployer.address,
    totalSupply: totalSupply.toString(),
    name: name,
    symbol: symbol,
    decimals: Number(decimals),
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    allocation: {
      tradingPool: "400000000000000000000000000", // 400M NUMA
      stakingRewards: "300000000000000000000000000", // 300M NUMA
      pioneerVault: "100000000000000000000000000", // 100M NUMA
      teamVesting: "100000000000000000000000000", // 100M NUMA
      treasury: "100000000000000000000000000" // 100M NUMA
    }
  };

  const deploymentPath = "./deployment-numa.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Instructions for next steps
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_NUMA_TOKEN_ADDRESS=${numaAddress}`);
  
  console.log("\n2. Distribute tokens using setDistributionAddresses():");
  console.log("   - Trading Pool address (PoolCentinelaRegeneracion)");
  console.log("   - Staking Rewards address (contract o wallet)");
  console.log("   - Pioneer Vault address (contract o wallet)");
  console.log("   - Team Vesting address (multisig wallet)");
  console.log("   - Treasury address (multisig wallet)");

  console.log("\n3. Verify on explorer:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${numaAddress}`);

  console.log("\n🔗 Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${numaAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
