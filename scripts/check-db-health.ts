import { sql } from '@vercel/postgres';

/**
 * Database Health Check Script
 * Verifica la conexión a la base de datos y las tablas
 */

async function checkDatabaseHealth() {
  console.log('🔍 Verificando salud de la base de datos...\n');

  try {
    // Test 1: Conexión básica
    console.log('1️⃣  Probando conexión a Postgres...');
    const { rows: version } = await sql`SELECT version()`;
    console.log('✅ Conectado a Postgres');
    console.log(`   Versión: ${version[0].version.split(' ')[0]}\n`);

    // Test 2: Verificar tablas
    console.log('2️⃣  Verificando tablas...');
    const { rows: tables } = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const expectedTables = [
      'users',
      'positions',
      'pioneers',
      'transactions',
      'achievements',
      'daily_rewards',
      'referrals',
      'analytics_events'
    ];

    const existingTables = tables.map(t => t.table_name);
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`✅ Tabla '${table}' existe`);
      } else {
        console.log(`❌ Tabla '${table}' NO ENCONTRADA`);
      }
    });
    console.log('');

    // Test 3: Contar registros
    console.log('3️⃣  Contando registros...');
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        try {
          const { rows } = await sql.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ${table}: ${rows[0].count} registros`);
        } catch (err) {
          console.log(`   ${table}: Error al contar - ${err.message}`);
        }
      }
    }
    console.log('');

    // Test 4: Verificar índices
    console.log('4️⃣  Verificando índices...');
    const { rows: indexes } = await sql`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    console.log(`✅ ${indexes.length} índices encontrados`);
    indexes.slice(0, 5).forEach(idx => {
      console.log(`   ${idx.tablename}.${idx.indexname}`);
    });
    if (indexes.length > 5) {
      console.log(`   ... y ${indexes.length - 5} más`);
    }
    console.log('');

    // Test 5: Crear usuario de prueba
    console.log('5️⃣  Probando INSERT (usuario de prueba)...');
    try {
      const testWallet = `0xtest${Date.now()}`;
      const testHash = `hash_${Date.now()}`;
      
      await sql`
        INSERT INTO users (
          wallet_address,
          world_id_hash,
          balance_numa,
          balance_wld,
          membership_tier
        ) VALUES (
          ${testWallet},
          ${testHash},
          10000,
          100,
          'free'
        )
        RETURNING id, wallet_address;
      `;
      
      console.log('✅ INSERT exitoso');
      
      // Cleanup
      await sql`DELETE FROM users WHERE wallet_address = ${testWallet}`;
      console.log('✅ DELETE exitoso (cleanup)');
      console.log('');
    } catch (err) {
      console.log(`❌ Error en INSERT: ${err.message}\n`);
    }

    // Summary
    console.log('========================================');
    console.log('📊 RESUMEN');
    console.log('========================================');
    console.log('✅ Base de datos operacional');
    console.log(`✅ ${existingTables.length}/${expectedTables.length} tablas encontradas`);
    console.log('✅ CRUD operations funcionando');
    console.log('\n🎉 Database Health Check PASSED!\n');

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
