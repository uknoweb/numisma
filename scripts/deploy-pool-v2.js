const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying PoolCentinelaRegeneracionV2 (with ERC-20 tokens)...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Load token addresses
  const numaDeployment = require("../deployment-numa.json");
  const numaAddress = numaDeployment.contractAddress;
  console.log("✅ NUMA Token:", numaAddress);

  // Load WLD token address (mock for testing)
  let wldAddress;
  try {
    const wldDeployment = require("../deployment-wld.json");
    wldAddress = wldDeployment.contractAddress;
    console.log("✅ WLD Token (Mock):", wldAddress);
    if (wldDeployment.isMock) {
      console.log("⚠️  Using MOCK WLD for testing");
    }
  } catch (e) {
    console.log("\n❌ ERROR: WLD token not deployed!");
    console.log("Run: npm run deploy:wld");
    process.exit(1);
  }

  // Initial WLD price (2.50 USD with 6 decimals)
  const initialWLDPrice = 2500000; // $2.50

  console.log("\n⏳ Deploying PoolCentinelaRegeneracionV2...");
  const Pool = await hre.ethers.getContractFactory("PoolCentinelaRegeneracionV2");
  const pool = await Pool.deploy(
    initialWLDPrice,
    numaAddress,
    wldAddress
  );

  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();

  console.log("✅ PoolV2 deployed to:", poolAddress);

  // Get initial info
  const wldPrice = await pool.wldPriceUSDT();
  const numaToken = await pool.numaToken();
  const wldToken = await pool.wldToken();

  console.log("\n📊 Pool Info:");
  console.log("   WLD Price (USDT):", Number(wldPrice) / 1000000, "USD");
  console.log("   NUMA Token:", numaToken);
  console.log("   WLD Token:", wldToken);
  console.log("   NUMA/WLD Rate: 10:1 (fixed)");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: poolAddress,
    deployer: deployer.address,
    initialWLDPrice: initialWLDPrice.toString(),
    numaTokenAddress: numaAddress,
    wldTokenAddress: wldAddress,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    version: "V2"
  };

  const deploymentPath = "./deployment-pool-v2.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Instructions
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=${poolAddress}`);
  
  console.log("\n2. Fund pool with initial liquidity:");
  console.log("   npm run fund:pool");
  
  console.log("\n3. Verify on explorer:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${poolAddress} ${initialWLDPrice} ${numaAddress} ${wldAddress}`);

  console.log("\n🔗 Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${poolAddress}`);

  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Update WLD_TOKEN_ADDRESS with real address before mainnet");
  console.log("   - Fund pool with NUMA and WLD liquidity");
  console.log("   - Transfer pool ownership if using multisig");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
