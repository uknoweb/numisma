const hre = require("hardhat");

async function main() {
  console.log("💰 Adding NUMA liquidity to PoolV2...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Funding from:", deployer.address);

  // Load contracts
  const poolDeployment = require("../deployment-pool-v2.json");
  const numaDeployment = require("../deployment-numa.json");

  const poolAddress = poolDeployment.contractAddress;
  const numaAddress = numaDeployment.contractAddress;

  const Pool = await hre.ethers.getContractFactory("PoolCentinelaRegeneracionV2");
  const pool = Pool.attach(poolAddress);

  const NUMA = await hre.ethers.getContractFactory("NumismaToken");
  const numa = NUMA.attach(numaAddress);

  const deployerNuma = await numa.balanceOf(deployer.address);
  console.log("📊 Deployer NUMA Balance:", hre.ethers.formatEther(deployerNuma));

  // Fund with 50M NUMA
  const numaAmount = hre.ethers.parseEther("50000000");
  console.log("💸 Funding Amount:", hre.ethers.formatEther(numaAmount), "NUMA");

  if (deployerNuma < numaAmount) {
    console.log("\n❌ Insufficient NUMA!");
    process.exit(1);
  }

  console.log("\n⏳ Approving NUMA...");
  const approveTx = await numa.approve(poolAddress, numaAmount);
  await approveTx.wait();
  console.log("✅ Approved");

  console.log("\n⏳ Funding pool...");
  const fundTx = await pool.fundPoolNUMA(numaAmount);
  await fundTx.wait();
  console.log("✅ Pool funded!");

  const poolNuma = await pool.poolBalanceNUMA();
  const poolWld = await pool.poolBalanceWLD();

  console.log("\n📊 Pool Liquidity:");
  console.log("   NUMA:", hre.ethers.formatEther(poolNuma));
  console.log("   WLD:", hre.ethers.formatEther(poolWld));
  console.log("\n✅ Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  });
