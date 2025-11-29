import { NextResponse } from "next/server";

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
    // TODO: Implementar cuando tengamos el contrato deployed
    // Por ahora solo logueamos
    
    const contractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS;

    if (!contractAddress) {
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

    // Implementación con viem cuando tengamos el contrato deployed:
    /*
    const { createWalletClient, http } = await import("viem");
    const { privateKeyToAccount } = await import("viem/accounts");
    const { worldchain } = await import("@/lib/chains");

    const account = privateKeyToAccount(process.env.ORACLE_PRIVATE_KEY as `0x${string}`);
    
    const walletClient = createWalletClient({
      account,
      chain: worldchain,
      transport: http(),
    });

    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: PoolABI,
      functionName: "updateWLDPrice",
      args: [BigInt(priceForContract)],
    });

    console.log(`[Oracle] Transaction sent: ${hash}`);
    */

    return NextResponse.json({
      success: true,
      message: "Oracle price updated successfully",
      price,
      priceForContract,
      source,
      timestamp: Math.floor(Date.now() / 1000),
      // txHash: hash, // Descomentar cuando esté implementado
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
