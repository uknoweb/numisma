import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint para monitoreo
 */
export async function GET() {
  const contractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS;
  const oracleConfigured = !!process.env.ORACLE_PRIVATE_KEY;
  
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      api: "operational",
      priceOracle: "operational",
      blockchain: contractAddress ? "configured" : "pending",
      oracleWallet: oracleConfigured ? "configured" : "not configured",
    },
    contract: {
      address: contractAddress || "not deployed",
      network: process.env.NEXT_PUBLIC_CHAIN_NAME || "worldchain-sepolia",
    },
  });
}
