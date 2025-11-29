const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PoolCentinelaRegeneracion...\n");

  // Obtener signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Precio inicial de WLD/USDT (ej: 2.50 USD = 2500000 con 6 decimales)
  const initialWLDPrice = 2_500_000; // 2.50 USD

  console.log("⚙️  Initial WLD/USDT Price:", initialWLDPrice / 1_000_000, "USD");

  // Deploy del contrato
  const PoolCentinelaRegeneracion = await hre.ethers.getContractFactory("PoolCentinelaRegeneracion");
  const pool = await PoolCentinelaRegeneracion.deploy(initialWLDPrice);

  await pool.waitForDeployment();

  const poolAddress = await pool.getAddress();

  console.log("\n✅ PoolCentinelaRegeneracion deployed to:", poolAddress);
  console.log("\n📋 Contract Details:");
  console.log("   Owner:", await pool.owner());
  console.log("   WLD/USDT Price:", Number(await pool.getWLDPrice()) / 1_000_000, "USD");
  console.log("   NUMA/WLD Rate:", await pool.getNUMAWLDRate());
  console.log("   Trading Fee:", await pool.TRADING_FEE(), "basis points (0.2%)");
  console.log("   Funding Rate:", await pool.FUNDING_RATE(), "basis points (0.01%)");
  console.log("   Funding Interval:", Number(await pool.FUNDING_INTERVAL()) / 3600, "hours");

  console.log("\n🔗 Add to .env.local:");
  console.log(`NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=${poolAddress}`);

  console.log("\n📝 Verify contract:");
  console.log(`npx hardhat verify --network worldchain-sepolia ${poolAddress} ${initialWLDPrice}`);

  // Guardar en archivo para fácil acceso
  const fs = require("fs");
  const deploymentInfo = {
    network: "worldchain-sepolia",
    contractAddress: poolAddress,
    deployer: deployer.address,
    initialWLDPrice,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    "./deployment-pool.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployment-pool.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
