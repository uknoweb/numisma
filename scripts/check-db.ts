import 'dotenv/config';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from '../lib/db/schema';

/**
 * Database Health Check usando Drizzle ORM
 */

async function checkDatabaseHealth() {
  console.log('🔍 Verificando salud de la base de datos...\n');

  try {
    const db = drizzle(sql, { schema });

    // Test 1: Conexión básica
    console.log('1️⃣  Probando conexión a Postgres...');
    const result = await sql`SELECT NOW() as current_time, version()`;
    console.log('✅ Conectado a Postgres');
    console.log(`   Hora actual: ${result.rows[0].current_time}`);
    console.log('');

    // Test 2: Contar usuarios
    console.log('2️⃣  Verificando tabla users...');
    const users = await db.select().from(schema.users).limit(5);
    console.log(`✅ ${users.length} usuarios en la muestra`);
    if (users.length > 0) {
      console.log(`   Ejemplo: ${users[0].walletAddress.slice(0, 10)}...`);
    }
    console.log('');

    // Test 3: Verificar posiciones
    console.log('3️⃣  Verificando tabla positions...');
    const positions = await db.select().from(schema.positions).limit(5);
    console.log(`✅ ${positions.length} posiciones en la muestra`);
    console.log('');

    // Test 4: Verificar transacciones
    console.log('4️⃣  Verificando tabla transactions...');
    const transactions = await db.select().from(schema.transactions).limit(5);
    console.log(`✅ ${transactions.length} transacciones en la muestra`);
    console.log('');

    console.log('========================================');
    console.log('✅ Database Health Check PASSED!');
    console.log('========================================');
    console.log('');
    console.log('La base de datos está funcionando correctamente.');
    console.log('Todas las tablas están accesibles.');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR en health check:');
    console.error(error);
    process.exit(1);
  }
}

checkDatabaseHealth()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
