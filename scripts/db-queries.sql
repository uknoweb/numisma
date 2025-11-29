-- ===========================================
-- QUICK DATABASE QUERIES
-- Para verificar datos después de testing
-- ===========================================

-- 1. Ver todos los usuarios (últimos 10)
SELECT 
  id,
  wallet_address,
  membership_tier,
  balance_numa,
  balance_wld,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Ver transacciones (últimas 20)
SELECT 
  id,
  user_id,
  type,
  amount_numa,
  amount_wld,
  description,
  created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Ver posiciones de trading (todas)
SELECT 
  id,
  user_id,
  type,
  size,
  entry_price,
  current_price,
  pnl,
  status,
  opened_at,
  closed_at
FROM positions 
ORDER BY opened_at DESC;

-- 4. Ver membresías activas
SELECT 
  wallet_address,
  membership_tier,
  membership_expires_at,
  consecutive_months,
  balance_numa,
  balance_wld
FROM users 
WHERE membership_tier != 'free'
ORDER BY membership_expires_at DESC;

-- 5. Contar registros en cada tabla
SELECT 
  'users' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'positions', COUNT(*) FROM positions
UNION ALL
SELECT 'pioneers', COUNT(*) FROM pioneers
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements;

-- 6. Ver usuario específico por wallet
-- (cambiar ADDRESS por tu wallet)
SELECT * FROM users 
WHERE wallet_address = '0xTU_ADDRESS_AQUI';

-- 7. Ver todas las transacciones de un usuario
-- (cambiar USER_ID)
SELECT * FROM transactions 
WHERE user_id = 1
ORDER BY created_at DESC;

-- 8. Ver todas las posiciones de un usuario
-- (cambiar USER_ID)
SELECT * FROM positions 
WHERE user_id = 1
ORDER BY opened_at DESC;

-- 9. Verificar onboarding bonus
SELECT 
  u.wallet_address,
  t.type,
  t.amount_numa,
  t.description,
  t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.type = 'bonus'
ORDER BY t.created_at DESC;

-- 10. Verificar pagos de membresía
SELECT 
  u.wallet_address,
  t.type,
  t.amount_wld,
  t.description,
  t.metadata,
  t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.type = 'membership_purchase'
ORDER BY t.created_at DESC;
