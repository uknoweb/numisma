/**
 * Script para probar manualmente la actualización del oráculo
 * Llama al endpoint /api/oracle/update localmente
 */

async function testOracle() {
  console.log("🔍 Testing Oracle Update Endpoint...\n");

  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const endpoint = `${url}/api/oracle/update`;

  try {
    console.log(`📡 Calling: ${endpoint}`);
    console.log(`🔑 Using CRON_SECRET: ${process.env.CRON_SECRET ? "✅ Set" : "❌ Not set"}`);
    console.log(`🔐 Using ORACLE_PRIVATE_KEY: ${process.env.ORACLE_PRIVATE_KEY ? "✅ Set" : "❌ Not set"}\n`);

    const headers = {};
    if (process.env.CRON_SECRET) {
      headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Oracle Update Successful!\n");
      console.log("📊 Response:");
      console.log(JSON.stringify(data, null, 2));
      
      if (data.txHash) {
        console.log(`\n🔗 Transaction: https://worldchain-sepolia.explorer.alchemy.com/tx/${data.txHash}`);
      }
    } else {
      console.error("❌ Oracle Update Failed!\n");
      console.error("📊 Response:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error testing oracle:");
    console.error(error.message);
  }
}

// Ejecutar
testOracle();
