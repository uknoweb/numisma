import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * Cliente de base de datos Drizzle ORM conectado a Vercel Postgres
 * 
 * Uso:
 * import { db } from "@/lib/db";
 * const users = await db.select().from(schema.users);
 */
export const db = drizzle(sql, { schema });

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
    .where(sql`${schema.users.walletAddress} = ${walletAddress}`)
    .limit(1);
  
  if (existingUser.length > 0) {
    // Actualizar último login
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(sql`${schema.users.id} = ${existingUser[0].id}`);
    
    return existingUser[0];
  }
  
  // Crear nuevo usuario
  const newUser = await db.insert(schema.users).values({
    walletAddress,
    worldIdHash,
    balanceNuma: 1000, // Balance inicial de bienvenida
    balanceWld: 10,
    membershipTier: "free",
  }).returning();
  
  return newUser[0];
}
