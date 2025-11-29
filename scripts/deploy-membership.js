const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🎫 Deploying MembershipManager...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Load WLD token address
  const wldDeployment = require("../deployment-wld.json");
  const wldAddress = wldDeployment.contractAddress;
  console.log("✅ WLD Token:", wldAddress);

  // Treasury address (usar el deployer por ahora, cambiar después)
  // TODO: Crear multisig wallet para treasury en producción
  const treasuryAddress = deployer.address;
  console.log("💰 Treasury:", treasuryAddress);

  console.log("\n⏳ Deploying MembershipManager...");
  const MembershipManager = await hre.ethers.getContractFactory("MembershipManager");
  const membership = await MembershipManager.deploy(wldAddress, treasuryAddress);

  await membership.waitForDeployment();
  const membershipAddress = await membership.getAddress();

  console.log("✅ MembershipManager deployed to:", membershipAddress);

  // Get tier info
  const freeLeverage = await membership.FREE_LEVERAGE();
  const plusLeverage = await membership.PLUS_LEVERAGE();
  const vipLeverage = await membership.VIP_LEVERAGE();
  
  const freePrice = await membership.FREE_PRICE();
  const plusPrice = await membership.plusPrice();
  const vipPrice = await membership.vipPrice();

  console.log("\n📊 Membership Tiers:");
  console.log("   FREE:");
  console.log("     Leverage:", Number(freeLeverage) + "x");
  console.log("     Price:", hre.ethers.formatEther(freePrice), "WLD");
  console.log("   PLUS:");
  console.log("     Leverage:", Number(plusLeverage) + "x");
  console.log("     Price:", hre.ethers.formatEther(plusPrice), "WLD");
  console.log("   VIP:");
  console.log("     Leverage:", Number(vipLeverage) + "x");
  console.log("     Price:", hre.ethers.formatEther(vipPrice), "WLD");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: membershipAddress,
    deployer: deployer.address,
    wldTokenAddress: wldAddress,
    treasuryAddress: treasuryAddress,
    tiers: {
      free: {
        leverage: Number(freeLeverage),
        price: freePrice.toString(),
      },
      plus: {
        leverage: Number(plusLeverage),
        price: plusPrice.toString(),
      },
      vip: {
        leverage: Number(vipLeverage),
        price: vipPrice.toString(),
      }
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = "./deployment-membership.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_MEMBERSHIP_ADDRESS=${membershipAddress}`);
  
  console.log("\n2. Update PoolV2 to check membership before opening positions");
  
  console.log("\n3. Test membership purchase:");
  console.log("   - User approves 5 WLD to MembershipManager");
  console.log("   - User calls buyMembership(1) for PLUS");
  console.log("   - Verify maxLeverage is now 50x");

  console.log("\n🔗 Explorer:");
  console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${membershipAddress}`);

  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Set proper treasury address (multisig) before mainnet");
  console.log("   - Membership prices can be adjusted by owner");
  console.log("   - Once purchased, memberships are permanent");
  console.log("   - Users can only upgrade, never downgrade");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
