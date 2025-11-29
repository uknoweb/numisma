const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Membership Leverage Limits...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Testing with address:", deployer.address);

  // Load contracts
  const poolDeployment = require("../deployment-pool-v2.json");
  const membershipDeployment = require("../deployment-membership.json");

  const poolAddress = poolDeployment.contractAddress;
  const membershipAddress = membershipDeployment.contractAddress;

  console.log("📍 Pool V2:", poolAddress);
  console.log("📍 MembershipManager:", membershipAddress);

  // Get contract instances
  const Pool = await hre.ethers.getContractFactory("PoolCentinelaRegeneracionV2");
  const pool = Pool.attach(poolAddress);

  const Membership = await hre.ethers.getContractFactory("MembershipManager");
  const membership = Membership.attach(membershipAddress);

  // Check current membership
  const currentTier = await membership.getMembershipLevel(deployer.address);
  const maxLeverage = await membership.getMaxLeverage(deployer.address);

  console.log("\n📊 Current Membership Status:");
  console.log("   Tier:", currentTier === 0n ? "FREE" : currentTier === 1n ? "PLUS" : "VIP");
  console.log("   Max Leverage:", Number(maxLeverage) + "x");

  // Test scenarios
  console.log("\n🧪 Test Scenarios:");

  const scenarios = [
    { leverage: 5, shouldPass: true, reason: "FREE tier allows 5x" },
    { leverage: 10, shouldPass: maxLeverage >= 10n, reason: maxLeverage >= 10n ? "Within limit" : "Exceeds FREE limit" },
    { leverage: 50, shouldPass: maxLeverage >= 50n, reason: maxLeverage >= 50n ? "PLUS tier" : "Requires PLUS" },
    { leverage: 100, shouldPass: maxLeverage >= 100n, reason: maxLeverage >= 100n ? "High tier" : "Requires VIP" },
    { leverage: 500, shouldPass: maxLeverage >= 500n, reason: maxLeverage >= 500n ? "VIP tier" : "Requires VIP" },
  ];

  for (const scenario of scenarios) {
    const status = scenario.shouldPass ? "✅ SHOULD PASS" : "❌ SHOULD FAIL";
    console.log(`\n   ${scenario.leverage}x leverage: ${status}`);
    console.log(`   Reason: ${scenario.reason}`);
  }

  console.log("\n💡 To test higher leverage:");
  console.log("   1. Buy PLUS membership (5 WLD):");
  console.log("      - Approve 5 WLD to MembershipManager");
  console.log("      - Call buyMembership(1)");
  console.log("   2. Buy VIP membership (15 WLD):");
  console.log("      - Approve 15 WLD to MembershipManager");
  console.log("      - Call buyMembership(2)");

  console.log("\n🔗 View on Explorer:");
  console.log(`   Pool: https://worldchain-sepolia.explorer.alchemy.com/address/${poolAddress}`);
  console.log(`   Membership: https://worldchain-sepolia.explorer.alchemy.com/address/${membershipAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
