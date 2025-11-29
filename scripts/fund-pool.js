const hre = require("hardhat");

async function main() {
  console.log("💰 Funding PoolV2 with initial liquidity...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Funding from:", deployer.address);

  const ethBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH\n");

  // Load deployed contract addresses
  const poolDeployment = require("../deployment-pool-v2.json");
  const numaDeployment = require("../deployment-numa.json");
  const wldDeployment = require("../deployment-wld.json");

  const poolAddress = poolDeployment.contractAddress;
  const numaAddress = numaDeployment.contractAddress;
  const wldAddress = wldDeployment.contractAddress;

  console.log("📍 Contracts:");
  console.log("   Pool V2:", poolAddress);
  console.log("   NUMA:", numaAddress);
  console.log("   WLD:", wldAddress, wldDeployment.isMock ? "(Mock)" : "");

  // Get contract instances
  const Pool = await hre.ethers.getContractFactory("PoolCentinelaRegeneracionV2");
  const pool = Pool.attach(poolAddress);

  const NUMA = await hre.ethers.getContractFactory("NumismaToken");
  const numa = NUMA.attach(numaAddress);

  const WLD = await hre.ethers.getContractFactory("MockWLD");
  const wld = WLD.attach(wldAddress);

  // Check current balances
  const deployerNuma = await numa.balanceOf(deployer.address);
  const deployerWld = await wld.balanceOf(deployer.address);

  console.log("\n📊 Deployer Token Balances:");
  console.log("   NUMA:", hre.ethers.formatEther(deployerNuma));
  console.log("   WLD:", hre.ethers.formatEther(deployerWld));

  // Define liquidity amounts
  // Pool needs enough to cover big wins
  // Start with WLD only, NUMA can be added by trading pool contract owner
  const wldAmount = hre.ethers.parseEther("1000000");   // 1M WLD for testing

  console.log("\n💸 Funding Amount:");
  console.log("   WLD:", hre.ethers.formatEther(wldAmount));
  console.log("\n⚠️  Note: NUMA liquidity should be transferred from Trading Pool (0xED888019DE2e5922E8c65f68Cf10d016ad330E60)");

  // Check if deployer has enough WLD
  if (deployerWld < wldAmount) {
    console.log("\n❌ Insufficient WLD balance!");
    console.log("   Need:", hre.ethers.formatEther(wldAmount));
    console.log("   Have:", hre.ethers.formatEther(deployerWld));
    process.exit(1);
  }

  // Approve Pool to spend WLD
  console.log("\n⏳ Approving WLD...");
  const approveTx = await wld.approve(poolAddress, wldAmount);
  await approveTx.wait();
  console.log("✅ WLD approved");

  // Fund Pool with WLD
  console.log("\n⏳ Funding pool with WLD...");
  const fundWldTx = await pool.fundPoolWLD(wldAmount);
  await fundWldTx.wait();
  console.log("✅ Pool funded with", hre.ethers.formatEther(wldAmount), "WLD");

  // Check pool balances
  const poolNuma = await pool.poolBalanceNUMA();
  const poolWld = await pool.poolBalanceWLD();

  console.log("\n📊 Pool Liquidity:");
  console.log("   NUMA:", hre.ethers.formatEther(poolNuma));
  console.log("   WLD:", hre.ethers.formatEther(poolWld));

  console.log("\n✅ Pool successfully funded!");
  console.log("\n📝 The pool now has liquidity to pay trader profits.");
  console.log("   Traders can deposit NUMA/WLD and open positions.");

  console.log("\n🔗 View on Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${poolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
