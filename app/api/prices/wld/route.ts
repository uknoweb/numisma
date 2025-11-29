import { NextResponse } from "next/server";

/**
 * GET /api/prices/wld
 * Obtiene el precio actual de WLD/USDT desde CoinGecko
 * Formato: { price: number, timestamp: number }
 */
export async function GET() {
  try {
    // CoinGecko API - Free tier (50 requests/minute)
    // worldcoin ID en CoinGecko
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=worldcoin&vs_currencies=usd&include_last_updated_at=true",
      {
        next: { revalidate: 1 }, // Cache por 1 segundo
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Verificar que existe el precio
    if (!data.worldcoin || !data.worldcoin.usd) {
      throw new Error("Price data not available");
    }

    const price = data.worldcoin.usd;
    const timestamp = data.worldcoin.last_updated_at || Math.floor(Date.now() / 1000);

    // Formato con 6 decimales para el contrato (ej: 2.50 = 2500000)
    const priceForContract = Math.floor(price * 1000000);

    return NextResponse.json(
      {
        price, // Precio original (ej: 2.50)
        priceForContract, // Precio formateado para contrato (ej: 2500000)
        timestamp,
        source: "coingecko",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1, stale-while-revalidate=2",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching WLD price:", error);

    // Fallback a precio mock si falla CoinGecko
    const mockPrice = 2.5; // USD
    const priceForContract = Math.floor(mockPrice * 1000000);

    return NextResponse.json(
      {
        price: mockPrice,
        priceForContract,
        timestamp: Math.floor(Date.now() / 1000),
        source: "fallback",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 200, // Devolvemos 200 con fallback para no romper el frontend
        headers: {
          "Cache-Control": "public, s-maxage=1, stale-while-revalidate=2",
        },
      }
    );
  }
}
