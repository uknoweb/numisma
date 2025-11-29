const hre = require("hardhat");

async function main() {
  console.log("📦 Setting NUMA Token Distribution...\n");

  // Load deployment info
  const deploymentInfo = require("../deployment-numa.json");
  const numaAddress = deploymentInfo.contractAddress;

  console.log("🎯 NUMA Token:", numaAddress);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer:", deployer.address, "\n");

  // Get contract instance
  const NumismaToken = await hre.ethers.getContractFactory("NumismaToken");
  const numaToken = NumismaToken.attach(numaAddress);

  // Check if distribution already completed
  const isCompleted = await numaToken.initialDistributionCompleted();
  if (isCompleted) {
    console.log("⚠️  Distribution already completed!");
    console.log("\n📊 Current Allocations:");
    console.log("   Trading Pool:", await numaToken.tradingPool());
    console.log("   Staking Rewards:", await numaToken.stakingRewards());
    console.log("   Pioneer Vault:", await numaToken.pioneerVault());
    console.log("   Team Vesting:", await numaToken.teamVesting());
    console.log("   Treasury:", await numaToken.treasury());
    return;
  }

  // Load Pool address from deployment-pool.json
  let poolAddress;
  try {
    const poolDeployment = require("../deployment-pool.json");
    poolAddress = poolDeployment.contractAddress;
    console.log("✅ Found PoolCentinelaRegeneracion:", poolAddress);
  } catch (error) {
    console.log("⚠️  Pool deployment not found, using placeholder");
    poolAddress = deployer.address; // Temporal, cambiar después
  }

  // Addresses for distribution
  // IMPORTANTE: Cambiar estas direcciones antes de mainnet
  const addresses = {
    tradingPool: poolAddress,                    // Pool contract
    stakingRewards: deployer.address,           // TODO: Deploy StakingRewards contract
    pioneerVault: deployer.address,             // TODO: Deploy PioneerVault contract
    teamVesting: deployer.address,              // TODO: Use multisig wallet
    treasury: deployer.address                  // TODO: Use multisig wallet
  };

  console.log("📊 Distribution Addresses:");
  console.log("   Trading Pool:    ", addresses.tradingPool, "(400M NUMA - 40%)");
  console.log("   Staking Rewards: ", addresses.stakingRewards, "(300M NUMA - 30%)");
  console.log("   Pioneer Vault:   ", addresses.pioneerVault, "(100M NUMA - 10%)");
  console.log("   Team Vesting:    ", addresses.teamVesting, "(100M NUMA - 10%)");
  console.log("   Treasury:        ", addresses.treasury, "(100M NUMA - 10%)");

  console.log("\n⏳ Executing distribution...");

  // Execute distribution
  const tx = await numaToken.setDistributionAddresses(
    addresses.tradingPool,
    addresses.stakingRewards,
    addresses.pioneerVault,
    addresses.teamVesting,
    addresses.treasury
  );

  console.log("📝 Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Distribution completed in block:", receipt.blockNumber);

  // Verify balances
  console.log("\n🔍 Verifying balances:");
  
  const tradingPoolBalance = await numaToken.balanceOf(addresses.tradingPool);
  const stakingBalance = await numaToken.balanceOf(addresses.stakingRewards);
  const pioneerBalance = await numaToken.balanceOf(addresses.pioneerVault);
  const teamBalance = await numaToken.balanceOf(addresses.teamVesting);
  const treasuryBalance = await numaToken.balanceOf(addresses.treasury);

  console.log("   Trading Pool:    ", hre.ethers.formatEther(tradingPoolBalance), "NUMA");
  console.log("   Staking Rewards: ", hre.ethers.formatEther(stakingBalance), "NUMA");
  console.log("   Pioneer Vault:   ", hre.ethers.formatEther(pioneerBalance), "NUMA");
  console.log("   Team Vesting:    ", hre.ethers.formatEther(teamBalance), "NUMA");
  console.log("   Treasury:        ", hre.ethers.formatEther(treasuryBalance), "NUMA");

  const deployerBalance = await numaToken.balanceOf(deployer.address);
  console.log("\n   Deployer remaining:", hre.ethers.formatEther(deployerBalance), "NUMA");

  console.log("\n✅ Distribution completed successfully!");
  console.log("\n🔗 View on explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${numaAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
