import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql as vercelSql } from "@vercel/postgres";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Cliente de base de datos Drizzle ORM conectado a Vercel Postgres
 * 
 * Uso:
 * import { db } from "@/lib/db";
 * const users = await db.select().from(schema.users);
 */
export const db = drizzle(vercelSql, { schema });

/**
 * Obtener balances reales de blockchain
 */
export async function getRealBalances(walletAddress: string): Promise<{ numa: number; wld: number }> {
  try {
    // Importación dinámica para evitar problemas de SSR
    const { publicClient } = await import("../blockchain");
    const { NUMA_TOKEN_ABI } = await import("../blockchain");
    
    const numaAddress = process.env.NEXT_PUBLIC_NUMA_TOKEN_ADDRESS as `0x${string}`;
    const wldAddress = process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS as `0x${string}`;
    
    if (!numaAddress || !wldAddress) {
      console.warn("Token addresses not configured, using default balances");
      return { numa: 0, wld: 0 };
    }
    
    // Consultar balances en paralelo
    const [numaBalance, wldBalance] = await Promise.all([
      publicClient.readContract({
        address: numaAddress,
        abi: NUMA_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: wldAddress,
        abi: NUMA_TOKEN_ABI, // WLD usa el mismo ABI (ERC20)
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      }),
    ]);
    
    // Convertir de wei a unidades
    const numa = Number(numaBalance) / 1e18;
    const wld = Number(wldBalance) / 1e18;
    
    return { numa, wld };
  } catch (error) {
    console.error("Error fetching real balances:", error);
    // En caso de error, retornar 0 (el usuario puede depositar después)
    return { numa: 0, wld: 0 };
  }
}

/**
 * Helper para testing/desarrollo - Crear usuario de prueba
 */
export async function createTestUser() {
  const testUser = await db.insert(schema.users).values({
    walletAddress: "0x1234567890123456789012345678901234567890",
    worldIdHash: "test_world_id_hash_" + Date.now(),
    balanceNuma: 10000,
    balanceWld: 100,
    membershipTier: "free",
  }).returning();
  
  return testUser[0];
}

/**
 * Helper - Obtener o crear usuario por wallet address
 */
export async function getOrCreateUser(walletAddress: string, worldIdHash: string) {
  // Buscar usuario existente
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.walletAddress, walletAddress))
    .limit(1);
  
  if (existingUser.length > 0) {
    // Usuario existente: actualizar último login Y balances reales
    const realBalances = await getRealBalances(walletAddress);
    
    const updated = await db
      .update(schema.users)
      .set({ 
        lastLoginAt: new Date(),
        balanceNuma: realBalances.numa,
        balanceWld: realBalances.wld,
      })
      .where(eq(schema.users.id, existingUser[0].id))
      .returning();
    
    return updated[0];
  }
  
  // Nuevo usuario: obtener balances reales de blockchain
  const realBalances = await getRealBalances(walletAddress);
  
  // Crear nuevo usuario con balances reales
  const newUser = await db.insert(schema.users).values({
    walletAddress,
    worldIdHash,
    balanceNuma: realBalances.numa,
    balanceWld: realBalances.wld,
    membershipTier: "free",
  }).returning();
  
  return newUser[0];
}
