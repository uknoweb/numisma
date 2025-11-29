import { sql } from '@vercel/postgres';

/**
 * Script para crear la tabla advanced_orders en Neon
 * Ejecutar: npx tsx scripts/create-advanced-orders-table.ts
 */
async function createAdvancedOrdersTable() {
  try {
    console.log('🚀 Creando tabla advanced_orders...');

    await sql`
      CREATE TABLE IF NOT EXISTS advanced_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        position_id UUID NOT NULL REFERENCES positions(id),
        
        -- Tipo de orden
        order_type VARCHAR(30) NOT NULL,
        
        -- Precios trigger
        trigger_price REAL,
        trigger_type VARCHAR(20),
        
        -- Porcentajes
        percentage REAL,
        trailing_percentage REAL,
        
        -- Trailing stop tracking
        highest_price REAL,
        lowest_price REAL,
        current_trigger_price REAL,
        
        -- Estado
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        triggered_at TIMESTAMP,
        cancelled_at TIMESTAMP
      );
    `;

    console.log('✅ Tabla advanced_orders creada exitosamente');

    // Crear índices para mejorar performance
    console.log('📊 Creando índices...');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_advanced_orders_user_id 
      ON advanced_orders(user_id);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_advanced_orders_position_id 
      ON advanced_orders(position_id);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_advanced_orders_status 
      ON advanced_orders(status);
    `;

    console.log('✅ Índices creados exitosamente');

    // Verificar
    const { rows } = await sql`
      SELECT COUNT(*) as count FROM advanced_orders;
    `;

    console.log(`✅ Tabla verificada. Órdenes: ${rows[0].count}`);
    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error al crear tabla:', error);
    process.exit(1);
  }
}

createAdvancedOrdersTable();
