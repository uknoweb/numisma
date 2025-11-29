const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("\n🚀 Deploying PioneerVault...");
  console.log("Deployer address:", deployer.address);
  
  // Cargar direcciones de contratos existentes
  const numaDeploymentPath = path.join(__dirname, "../deployment-numa.json");
  const poolDeploymentPath = path.join(__dirname, "../deployment-pool-v2.json");
  
  let numaAddress, poolAddress;
  
  // Leer dirección de NUMA
  if (fs.existsSync(numaDeploymentPath)) {
    const numaDeployment = JSON.parse(fs.readFileSync(numaDeploymentPath, "utf8"));
    numaAddress = numaDeployment.contractAddress;
    console.log("✅ NUMA Token:", numaAddress);
  } else {
    throw new Error("❌ NUMA deployment not found!");
  }
  
  // Leer dirección del Pool
  if (fs.existsSync(poolDeploymentPath)) {
    const poolDeployment = JSON.parse(fs.readFileSync(poolDeploymentPath, "utf8"));
    poolAddress = poolDeployment.contractAddress;
    console.log("✅ Pool V2:", poolAddress);
  } else {
    throw new Error("❌ Pool V2 deployment not found!");
  }
  
  // Desplegar PioneerVault
  const PioneerVault = await hre.ethers.getContractFactory("PioneerVault");
  const vault = await PioneerVault.deploy(
    numaAddress,  // NUMA token
    poolAddress   // Trading pool
  );
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("\n✅ PioneerVault deployed to:", vaultAddress);
  
  // Guardar deployment info
  const deploymentInfo = {
    contractAddress: vaultAddress,
    numaTokenAddress: numaAddress,
    tradingPoolAddress: poolAddress,
    deployer: deployer.address,
    network: hre.network.name,
    deploymentDate: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    constants: {
      maxPioneers: 100,
      lockPeriod: "365 days (1 year)",
      earlyWithdrawalPenalty: "20%",
      profitShare: "5%"
    }
  };
  
  const outputPath = path.join(__dirname, "../deployment-pioneer-vault.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📄 Deployment info saved to:", outputPath);
  
  console.log("\n📊 PioneerVault Details:");
  console.log("   Max Pioneers: 100");
  console.log("   Lock Period: 1 year");
  console.log("   Early Withdrawal Penalty: 20%");
  console.log("   Profit Share: 5% of pool profits");
  
  console.log("\n🔍 Verify contract with:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${vaultAddress} "${numaAddress}" "${poolAddress}"`);
  
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
