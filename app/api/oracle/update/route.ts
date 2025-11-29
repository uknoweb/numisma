import { NextResponse } from "next/server";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { worldchainSepolia } from "@/lib/wagmi";
import { POOL_ABI, POOL_CONTRACT_ADDRESS } from "@/lib/contracts";

/**
 * POST /api/oracle/update
 * Actualiza el precio de WLD/USDT en el smart contract
 * Llamado por Vercel Cron cada 5 minutos
 * 
 * IMPORTANTE: Necesita ORACLE_PRIVATE_KEY en variables de entorno
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación del cron (Vercel añade este header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Obtener precio actual de WLD
    const priceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/prices/wld`
    );

    if (!priceResponse.ok) {
      throw new Error("Failed to fetch WLD price");
    }

    const { priceForContract, price, source } = await priceResponse.json();

    console.log(`[Oracle] Updating WLD price: ${price} USD (${priceForContract} for contract)`);

    // 2. Actualizar precio en el contrato
    if (!POOL_CONTRACT_ADDRESS) {
      console.warn("[Oracle] Contract address not configured, skipping on-chain update");
      return NextResponse.json({
        success: true,
        message: "Price fetched but contract update skipped (not deployed yet)",
        price,
        priceForContract,
        source,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!oraclePrivateKey) {
      throw new Error("ORACLE_PRIVATE_KEY not configured");
    }

    // Crear cuenta desde private key
    const account = privateKeyToAccount(oraclePrivateKey as `0x${string}`);
    
    // Crear cliente público para verificar red
    const publicClient = createPublicClient({
      chain: worldchainSepolia,
      transport: http(`https://worldchain-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    });

    // Crear cliente de wallet
    const walletClient = createWalletClient({
      account,
      chain: worldchainSepolia,
      transport: http(`https://worldchain-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    });

    console.log(`[Oracle] Sending transaction from: ${account.address}`);
    console.log(`[Oracle] Contract: ${POOL_CONTRACT_ADDRESS}`);
    console.log(`[Oracle] New price: ${priceForContract}`);

    // Llamar a updateWLDPrice en el contrato
    const hash = await walletClient.writeContract({
      address: POOL_CONTRACT_ADDRESS as `0x${string}`,
      abi: POOL_ABI,
      functionName: "updateWLDPrice",
      args: [BigInt(priceForContract)],
    });

    console.log(`[Oracle] Transaction sent: ${hash}`);

    // Esperar confirmación
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 1,
    });

    console.log(`[Oracle] Transaction confirmed in block: ${receipt.blockNumber}`);

    return NextResponse.json({
      success: true,
      message: "Oracle price updated successfully",
      price,
      priceForContract,
      source,
      timestamp: Math.floor(Date.now() / 1000),
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
    });
  } catch (error) {
    console.error("[Oracle] Error updating price:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle/update
 * Endpoint para testing manual
 */
export async function GET() {
  return NextResponse.json({
    message: "Oracle update endpoint. Use POST to trigger update.",
    instructions: "Configure CRON_SECRET and ORACLE_PRIVATE_KEY in environment variables.",
    status: "ready",
  });
}
