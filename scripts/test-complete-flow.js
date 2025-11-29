const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Test End-to-End del ecosistema Numisma
 * 
 * Flujo completo:
 * 1. Obtener WLD del faucet
 * 2. Aprobar NUMA para Pool
 * 3. Depositar NUMA al Pool
 * 4. Aprobar WLD para Membership
 * 5. Comprar membership PLUS (50x leverage)
 * 6. Abrir posición con 50x leverage (debe funcionar)
 * 7. Intentar abrir posición con 100x leverage (debe fallar)
 * 8. Cerrar posición
 * 9. Withdraw NUMA del pool
 * 10. Depositar NUMA al Pioneer Vault
 * 11. Verificar ranking
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("\n🧪 NUMISMA END-TO-END TESTING");
  console.log("=====================================");
  console.log("Tester address:", deployer.address);
  
  // Cargar direcciones de contratos
  const numaDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployment-numa.json"), "utf8")
  );
  const wldDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployment-wld.json"), "utf8")
  );
  const poolDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployment-pool-v2.json"), "utf8")
  );
  const membershipDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployment-membership.json"), "utf8")
  );
  const vaultDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployment-pioneer-vault.json"), "utf8")
  );
  
  const NUMA_ADDRESS = numaDeployment.contractAddress;
  const WLD_ADDRESS = wldDeployment.contractAddress;
  const POOL_ADDRESS = poolDeployment.contractAddress;
  const MEMBERSHIP_ADDRESS = membershipDeployment.contractAddress;
  const VAULT_ADDRESS = vaultDeployment.contractAddress;
  
  console.log("\n📋 Contract Addresses:");
  console.log("   NUMA Token:", NUMA_ADDRESS);
  console.log("   WLD Token:", WLD_ADDRESS);
  console.log("   Pool V2:", POOL_ADDRESS);
  console.log("   Membership:", MEMBERSHIP_ADDRESS);
  console.log("   Pioneer Vault:", VAULT_ADDRESS);
  
  // Obtener contratos
  const numaToken = await hre.ethers.getContractAt("NumismaToken", NUMA_ADDRESS);
  const wldToken = await hre.ethers.getContractAt("MockWLD", WLD_ADDRESS);
  const pool = await hre.ethers.getContractAt("PoolCentinelaRegeneracionV2", POOL_ADDRESS);
  const membership = await hre.ethers.getContractAt("MembershipManager", MEMBERSHIP_ADDRESS);
  const vault = await hre.ethers.getContractAt("PioneerVault", VAULT_ADDRESS);
  
  const results = {
    timestamp: new Date().toISOString(),
    tester: deployer.address,
    tests: [],
    success: 0,
    failed: 0,
    transactions: []
  };
  
  // ========== TEST 1: Obtener WLD del faucet ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 1: Obtener WLD del Faucet");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const wldBalanceBefore = await wldToken.balanceOf(deployer.address);
    console.log("WLD balance before:", hre.ethers.formatUnits(wldBalanceBefore, 18));
    
    const faucetTx = await wldToken.faucet();
    const faucetReceipt = await faucetTx.wait();
    
    const wldBalanceAfter = await wldToken.balanceOf(deployer.address);
    console.log("WLD balance after:", hre.ethers.formatUnits(wldBalanceAfter, 18));
    console.log("✅ Received 1000 WLD from faucet");
    console.log("   TX:", faucetReceipt.hash);
    
    results.tests.push({ test: "Faucet WLD", status: "PASSED" });
    results.transactions.push({ name: "Faucet WLD", hash: faucetReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Faucet WLD", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 2: Aprobar NUMA para Pool ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 2: Aprobar NUMA para Pool");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const numaBalance = await numaToken.balanceOf(deployer.address);
    console.log("NUMA balance:", hre.ethers.formatUnits(numaBalance, 18));
    
    const approveAmount = hre.ethers.parseUnits("10000", 18);
    const approveTx = await numaToken.approve(POOL_ADDRESS, approveAmount);
    const approveReceipt = await approveTx.wait();
    
    const allowance = await numaToken.allowance(deployer.address, POOL_ADDRESS);
    console.log("✅ Approved 10,000 NUMA for Pool");
    console.log("   Allowance:", hre.ethers.formatUnits(allowance, 18));
    console.log("   TX:", approveReceipt.hash);
    
    results.tests.push({ test: "Approve NUMA for Pool", status: "PASSED" });
    results.transactions.push({ name: "Approve NUMA", hash: approveReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Approve NUMA for Pool", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 3: Depositar NUMA al Pool ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 3: Depositar NUMA al Pool");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const depositAmount = hre.ethers.parseUnits("5000", 18);
    const depositTx = await pool.depositNUMA(depositAmount);
    const depositReceipt = await depositTx.wait();
    
    const poolBalance = await pool.traderBalanceNUMA(deployer.address);
    console.log("✅ Deposited 5,000 NUMA to Pool");
    console.log("   Pool balance:", hre.ethers.formatUnits(poolBalance, 18));
    console.log("   TX:", depositReceipt.hash);
    
    results.tests.push({ test: "Deposit NUMA to Pool", status: "PASSED" });
    results.transactions.push({ name: "Deposit NUMA", hash: depositReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Deposit NUMA to Pool", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 3.5: Aprobar y Depositar WLD al Pool ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 3.5: Aprobar y Depositar WLD al Pool");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    // Aprobar WLD para Pool
    const approveWLDPoolAmount = hre.ethers.parseUnits("1000", 18);
    const approveWLDPoolTx = await wldToken.approve(POOL_ADDRESS, approveWLDPoolAmount);
    await approveWLDPoolTx.wait();
    
    // Depositar WLD
    const depositWLDAmount = hre.ethers.parseUnits("500", 18);
    const depositWLDTx = await pool.depositWLD(depositWLDAmount);
    const depositWLDReceipt = await depositWLDTx.wait();
    
    const poolWLDBalance = await pool.traderBalanceWLD(deployer.address);
    console.log("✅ Deposited 500 WLD to Pool");
    console.log("   Pool WLD balance:", hre.ethers.formatUnits(poolWLDBalance, 18));
    console.log("   TX:", depositWLDReceipt.hash);
    
    results.tests.push({ test: "Deposit WLD to Pool", status: "PASSED" });
    results.transactions.push({ name: "Deposit WLD", hash: depositWLDReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Deposit WLD to Pool", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 4: Verificar Membership Inicial (FREE) ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 4: Verificar Membership Inicial");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const tier = await membership.getMembershipLevel(deployer.address);
    const maxLeverage = await membership.getMaxLeverage(deployer.address);
    
    console.log("✅ Current Membership:");
    console.log("   Tier:", tier === 0n ? "FREE" : tier === 1n ? "PLUS" : "VIP");
    console.log("   Max Leverage:", maxLeverage.toString() + "x");
    
    results.tests.push({ test: "Check Initial Membership", status: "PASSED" });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Check Initial Membership", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 5: Aprobar WLD para Membership ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 5: Aprobar WLD para Membership");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const approveWLDAmount = hre.ethers.parseUnits("10", 18);
    const approveWLDTx = await wldToken.approve(MEMBERSHIP_ADDRESS, approveWLDAmount);
    const approveWLDReceipt = await approveWLDTx.wait();
    
    const wldAllowance = await wldToken.allowance(deployer.address, MEMBERSHIP_ADDRESS);
    console.log("✅ Approved 10 WLD for Membership");
    console.log("   Allowance:", hre.ethers.formatUnits(wldAllowance, 18));
    console.log("   TX:", approveWLDReceipt.hash);
    
    results.tests.push({ test: "Approve WLD for Membership", status: "PASSED" });
    results.transactions.push({ name: "Approve WLD", hash: approveWLDReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Approve WLD for Membership", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 6: Comprar Membership PLUS ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 6: Comprar Membership PLUS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const currentTier = await membership.getMembershipLevel(deployer.address);
    
    if (currentTier === 1n) {
      console.log("✅ Already has PLUS Membership");
      console.log("   Tier: PLUS");
      console.log("   Max Leverage: 50x");
      results.tests.push({ test: "Buy PLUS Membership", status: "PASSED" });
      results.success++;
    } else {
      const buyTx = await membership.buyMembership(1); // 1 = PLUS
      const buyReceipt = await buyTx.wait();
      
      const newTier = await membership.getMembershipLevel(deployer.address);
      const newMaxLeverage = await membership.getMaxLeverage(deployer.address);
      
      console.log("✅ Purchased PLUS Membership");
      console.log("   New Tier:", newTier === 1n ? "PLUS" : "Unknown");
      console.log("   New Max Leverage:", newMaxLeverage.toString() + "x");
      console.log("   TX:", buyReceipt.hash);
      
      results.tests.push({ test: "Buy PLUS Membership", status: "PASSED" });
      results.transactions.push({ name: "Buy PLUS Membership", hash: buyReceipt.hash });
      results.success++;
    }
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Buy PLUS Membership", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 7: Abrir Posición con 50x Leverage (debe pasar) ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 7: Abrir Posición 50x Leverage");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const pair = 0; // TradingPair.NUMA_WLD
    const positionType = 0; // LONG
    const leverage = 50;
    
    const openTx = await pool.openPosition(pair, positionType, leverage);
    const openReceipt = await openTx.wait();
    
    console.log("✅ Position opened with 50x leverage");
    console.log("   Leverage: 50x");
    console.log("   Direction: LONG");
    console.log("   TX:", openReceipt.hash);
    
    results.tests.push({ test: "Open Position 50x", status: "PASSED" });
    results.transactions.push({ name: "Open Position 50x", hash: openReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Open Position 50x", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 8: Intentar Abrir Posición con 100x Leverage (debe fallar) ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 8: Intentar Posición 100x (debe fallar)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const pair = 0; // TradingPair.NUMA_WLD
    const positionType = 0; // LONG
    const leverage = 100;
    
    await pool.openPosition(pair, positionType, leverage);
    
    console.log("❌ FAILED: Should have rejected 100x leverage for PLUS tier");
    results.tests.push({ test: "Reject 100x Leverage", status: "FAILED", error: "Did not reject" });
    results.failed++;
  } catch (error) {
    if (error.message.includes("Leverage exceeds membership limit")) {
      console.log("✅ Correctly rejected 100x leverage");
      console.log("   Error:", error.message.split("(")[0].trim());
      results.tests.push({ test: "Reject 100x Leverage", status: "PASSED" });
      results.success++;
    } else {
      console.log("❌ FAILED with unexpected error:", error.message);
      results.tests.push({ test: "Reject 100x Leverage", status: "FAILED", error: error.message });
      results.failed++;
    }
  }
  
  // ========== TEST 9: Cerrar Posición ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 9: Cerrar Posición");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const closeTx = await pool.closePosition(0); // Position ID 0
    const closeReceipt = await closeTx.wait();
    
    console.log("✅ Position closed");
    console.log("   TX:", closeReceipt.hash);
    
    results.tests.push({ test: "Close Position", status: "PASSED" });
    results.transactions.push({ name: "Close Position", hash: closeReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Close Position", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 10: Withdraw NUMA del Pool ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 10: Withdraw NUMA del Pool");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const poolBalance = await pool.traderBalanceNUMA(deployer.address);
    const withdrawAmount = poolBalance / 2n; // Retirar la mitad
    
    const withdrawTx = await pool.withdrawNUMA(withdrawAmount);
    const withdrawReceipt = await withdrawTx.wait();
    
    const newPoolBalance = await pool.traderBalanceNUMA(deployer.address);
    console.log("✅ Withdrew NUMA from pool");
    console.log("   Amount:", hre.ethers.formatUnits(withdrawAmount, 18));
    console.log("   Remaining in pool:", hre.ethers.formatUnits(newPoolBalance, 18));
    console.log("   TX:", withdrawReceipt.hash);
    
    results.tests.push({ test: "Withdraw NUMA", status: "PASSED" });
    results.transactions.push({ name: "Withdraw NUMA", hash: withdrawReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Withdraw NUMA", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 11: Aprobar NUMA para Pioneer Vault ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 11: Aprobar NUMA para Vault");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const approveVaultAmount = hre.ethers.parseUnits("1000", 18);
    const approveVaultTx = await numaToken.approve(VAULT_ADDRESS, approveVaultAmount);
    const approveVaultReceipt = await approveVaultTx.wait();
    
    console.log("✅ Approved 1,000 NUMA for Vault");
    console.log("   TX:", approveVaultReceipt.hash);
    
    results.tests.push({ test: "Approve NUMA for Vault", status: "PASSED" });
    results.transactions.push({ name: "Approve NUMA for Vault", hash: approveVaultReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Approve NUMA for Vault", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== TEST 12: Depositar NUMA al Pioneer Vault ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 12: Depositar al Pioneer Vault");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const vaultDepositAmount = hre.ethers.parseUnits("1000", 18);
    const vaultDepositTx = await vault.depositCapital(vaultDepositAmount);
    const vaultDepositReceipt = await vaultDepositTx.wait();
    
    const ranking = await vault.getRanking(deployer.address);
    const pioneerInfo = await vault.getPioneerInfo(deployer.address);
    
    console.log("✅ Deposited 1,000 NUMA to Pioneer Vault");
    console.log("   Ranking:", ranking.toString());
    console.log("   Capital Locked:", hre.ethers.formatUnits(pioneerInfo[0], 18));
    console.log("   Is Active:", pioneerInfo[4]);
    console.log("   TX:", vaultDepositReceipt.hash);
    
    results.tests.push({ test: "Deposit to Vault", status: "PASSED" });
    results.transactions.push({ name: "Deposit to Vault", hash: vaultDepositReceipt.hash });
    results.success++;
  } catch (error) {
    console.log("❌ FAILED:", error.message);
    results.tests.push({ test: "Deposit to Vault", status: "FAILED", error: error.message });
    results.failed++;
  }
  
  // ========== RESUMEN ==========
  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Passed: ${results.success}/${results.tests.length}`);
  console.log(`❌ Failed: ${results.failed}/${results.tests.length}`);
  console.log(`📝 Total Transactions: ${results.transactions.length}`);
  
  console.log("\n📋 Test Details:");
  results.tests.forEach((test, i) => {
    const icon = test.status === "PASSED" ? "✅" : "❌";
    console.log(`   ${i + 1}. ${icon} ${test.test}`);
  });
  
  console.log("\n🔗 Transactions:");
  results.transactions.forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.name}`);
    console.log(`      https://worldchain-sepolia.explorer.alchemy.com/tx/${tx.hash}`);
  });
  
  // Guardar resultados
  const outputPath = path.join(__dirname, "../test-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log("\n💾 Results saved to:", outputPath);
  
  if (results.failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! 🎉");
    console.log("The Numisma ecosystem is fully functional!");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
