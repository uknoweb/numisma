import hre from "hardhat";

/**
 * Script de deploy para contratos de Numisma
 * 
 * TESTNET:  npx hardhat run scripts/deploy.ts --network worldchain-sepolia
 * MAINNET:  npx hardhat run scripts/deploy.ts --network worldchain
 * 
 * DISTRIBUCIÓN DE TOKENS:
 * - TradingPool:    400M NUMA (40%) - Liquidez para ganancias de usuarios
 * - PioneerVault:   100M NUMA (10%) - Pagos cada 15 días
 * - StakingVault:   300M NUMA (30%) - Claims diarios
 * - Treasury:       100M NUMA (10%) - Reserva de emergencia
 * - Team Vesting:   100M NUMA (10%) - Equipo con lock de 1 año
 * 
 * TOTAL: 1,000,000,000 NUMA
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const isMainnet = network === "worldchain";
  
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          🏛️  NUMISMA DEPLOYMENT SCRIPT                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log("📊 Deployment Info:");
  console.log("   Network:        ", network);
  console.log("   Deployer:       ", deployer.address);
  console.log("   Balance:        ", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "WLD");
  console.log("   Is Mainnet:     ", isMainnet ? "🔴 YES - REAL MONEY!" : "🟢 No (testnet)");
  console.log("");
  
  if (isMainnet) {
    console.log("⚠️  WARNING: You are deploying to MAINNET!");
    console.log("   - Use hardware wallet (Ledger/Trezor)");
    console.log("   - Verify all contract addresses");
    console.log("   - Have emergency plan ready");
    console.log("");
  }

  // 1. Deploy NumismaToken
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 [1/3] Deploying NumismaToken...");
  const NumismaToken = await hre.ethers.getContractFactory("NumismaToken");
  const numaToken = await NumismaToken.deploy();
  await numaToken.waitForDeployment();
  const numaTokenAddress = await numaToken.getAddress();
  console.log("✅ NumismaToken deployed to:", numaTokenAddress);
  
  // Verificar supply inicial
  const totalSupply = await numaToken.totalSupply();
  const deployerBalance = await numaToken.balanceOf(deployer.address);
  console.log("   Total Supply:       ", hre.ethers.formatEther(totalSupply), "NUMA");
  console.log("   Deployer Balance:   ", hre.ethers.formatEther(deployerBalance), "NUMA");
  console.log("");

  // 2. Deploy TradingPool
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 [2/3] Deploying TradingPool...");
  const TradingPool = await hre.ethers.getContractFactory("TradingPool");
  const tradingPool = await TradingPool.deploy(numaTokenAddress);
  await tradingPool.waitForDeployment();
  const tradingPoolAddress = await tradingPool.getAddress();
  console.log("✅ TradingPool deployed to:", tradingPoolAddress);
  console.log("");

  // 3. Deploy PioneerVault
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 [3/3] Deploying PioneerVault...");
  const PioneerVault = await hre.ethers.getContractFactory("PioneerVault");
  const pioneerVault = await PioneerVault.deploy();
  await pioneerVault.waitForDeployment();
  const pioneerVaultAddress = await pioneerVault.getAddress();
  console.log("✅ PioneerVault deployed to:", pioneerVaultAddress);
  console.log("");

  // 4. DISTRIBUCIÓN DE TOKENS
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 Token Distribution (1B NUMA total)\n");
  
  const distributions = [
    {
      name: "TradingPool (Liquidity)",
      address: tradingPoolAddress,
      amount: hre.ethers.parseEther("400000000"), // 400M (40%)
      percentage: "40%",
      description: "Funds to pay winning traders"
    },
    {
      name: "PioneerVault (Rewards)",
      address: pioneerVaultAddress,
      amount: hre.ethers.parseEther("100000000"), // 100M (10%)
      percentage: "10%",
      description: "Pioneer earnings every 15 days"
    },
    // Los siguientes se quedan en el deployer por ahora
    // En producción, crear contratos separados para cada uno
  ];
  
  let totalDistributed = BigInt(0);
  
  for (const dist of distributions) {
    console.log(`📤 Transferring ${hre.ethers.formatEther(dist.amount)} NUMA (${dist.percentage})`);
    console.log(`   To: ${dist.name}`);
    console.log(`   Address: ${dist.address}`);
    console.log(`   Purpose: ${dist.description}`);
    
    const tx = await numaToken.transfer(dist.address, dist.amount);
    await tx.wait();
    
    const balance = await numaToken.balanceOf(dist.address);
    console.log(`   ✅ Balance confirmed: ${hre.ethers.formatEther(balance)} NUMA\n`);
    
    totalDistributed += dist.amount;
  }
  
  // 5. Fondear el TradingPool (aprovación interna)
  console.log("🔄 Approving TradingPool to use its NUMA...");
  await tradingPool.fundPool(distributions[0].amount);
  console.log("✅ TradingPool ready to pay traders\n");
  
  // 6. Balances finales
  const deployerFinalBalance = await numaToken.balanceOf(deployer.address);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Final Token Distribution:\n");
  console.log(`   TradingPool:     ${hre.ethers.formatEther(distributions[0].amount).padStart(15)} NUMA (40%)`);
  console.log(`   PioneerVault:    ${hre.ethers.formatEther(distributions[1].amount).padStart(15)} NUMA (10%)`);
  console.log(`   Deployer:        ${hre.ethers.formatEther(deployerFinalBalance).padStart(15)} NUMA (50%)`);
  console.log(`   ─────────────────────────────────────────`);
  console.log(`   TOTAL:           ${hre.ethers.formatEther(totalSupply).padStart(15)} NUMA (100%)`);
  console.log("");

  // 7. Resumen de deployment
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                  📊 DEPLOYMENT SUMMARY                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log("📍 Contract Addresses:\n");
  console.log(`   NumismaToken:     ${numaTokenAddress}`);
  console.log(`   TradingPool:      ${tradingPoolAddress}`);
  console.log(`   PioneerVault:     ${pioneerVaultAddress}`);
  console.log("");
  
  console.log("👤 Access Control:\n");
  console.log(`   NumismaToken Owner:   ${deployer.address}`);
  console.log(`   TradingPool Owner:    ${deployer.address}`);
  console.log(`   PioneerVault Owner:   ${deployer.address}`);
  console.log("");
  
  console.log("⚠️  DEPLOYER RESPONSIBILITIES:\n");
  console.log("   - You control 500M NUMA (50% of supply)");
  console.log("   - You are owner of all contracts");
  console.log("   - You can pause contracts in emergency");
  console.log("   - KEEP YOUR PRIVATE KEY SAFE!");
  console.log("");

  // 8. Guardar addresses para .env.local
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 Environment Variables for .env.local:\n");
  console.log(`NEXT_PUBLIC_NUMA_TOKEN_ADDRESS=${numaTokenAddress}`);
  console.log(`NEXT_PUBLIC_TRADING_POOL_ADDRESS=${tradingPoolAddress}`);
  console.log(`NEXT_PUBLIC_PIONEER_VAULT_ADDRESS=${pioneerVaultAddress}`);
  console.log("");

  // 9. Esperar confirmaciones antes de verificar
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⏳ Waiting for block confirmations (5 blocks)...\n");
  
  await numaToken.deploymentTransaction()?.wait(5);
  console.log("   ✅ NumismaToken confirmed");
  
  await tradingPool.deploymentTransaction()?.wait(5);
  console.log("   ✅ TradingPool confirmed");
  
  await pioneerVault.deploymentTransaction()?.wait(5);
  console.log("   ✅ PioneerVault confirmed");
  console.log("");

  // 10. Verificar contratos en explorer (solo si no es localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 Verifying contracts on block explorer...\n");
    
    const explorerUrl = isMainnet 
      ? "https://worldchain-mainnet.explorer.alchemy.com"
      : "https://worldchain-sepolia.explorer.alchemy.com";
    
    try {
      console.log("   📝 Verifying NumismaToken...");
      await hre.run("verify:verify", {
        address: numaTokenAddress,
        constructorArguments: [],
      });
      console.log(`   ✅ NumismaToken verified: ${explorerUrl}/address/${numaTokenAddress}\n`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("   ℹ️  NumismaToken already verified\n");
      } else {
        console.log("   ⚠️  NumismaToken verification failed:", error.message, "\n");
      }
    }

    try {
      console.log("   📝 Verifying TradingPool...");
      await hre.run("verify:verify", {
        address: tradingPoolAddress,
        constructorArguments: [numaTokenAddress],
      });
      console.log(`   ✅ TradingPool verified: ${explorerUrl}/address/${tradingPoolAddress}\n`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("   ℹ️  TradingPool already verified\n");
      } else {
        console.log("   ⚠️  TradingPool verification failed:", error.message, "\n");
      }
    }

    try {
      console.log("   📝 Verifying PioneerVault...");
      await hre.run("verify:verify", {
        address: pioneerVaultAddress,
        constructorArguments: [],
      });
      console.log(`   ✅ PioneerVault verified: ${explorerUrl}/address/${pioneerVaultAddress}\n`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("   ℹ️  PioneerVault already verified\n");
      } else {
        console.log("   ⚠️  PioneerVault verification failed:", error.message, "\n");
      }
    }
  }

  // 11. Mensaje final
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              ✨ DEPLOYMENT COMPLETE! ✨                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  if (!isMainnet) {
    console.log("🟢 Testnet deployment successful!");
    console.log("   → Test thoroughly before mainnet");
    console.log("   → Verify all contract functions");
    console.log("   → Check token distribution");
  } else {
    console.log("🔴 MAINNET DEPLOYMENT SUCCESSFUL!");
    console.log("   → Monitor contracts 24/7");
    console.log("   → Have emergency plan ready");
    console.log("   → Transfer ownership to multi-sig ASAP");
    console.log("");
    console.log("⚠️  CRITICAL NEXT STEPS:");
    console.log("   1. Create Gnosis Safe");
    console.log("   2. Transfer ownership:");
    console.log(`      await numaToken.transferOwnership(SAFE_ADDRESS)`);
    console.log("   3. Announce addresses publicly");
    console.log("   4. Get contracts audited");
  }
  
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
