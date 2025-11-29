import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * API Route: Aplicar código de referido
 * POST /api/referrals/apply
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, referrerId, code } = await request.json();

    if (!userId || !referrerId || !code) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no haya usado un código antes
      SELECT * FROM referrals WHERE referred_id = ${userId}
    `;

    if (existingReferral.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya has usado un código de referido' },
        { status: 400 }
      );
    }

    const referrer = await sql`
      SELECT * FROM users WHERE id = ${referrerId}
    `;

    if (referrer.rows.length === 0) {
      return NextResponse.json(
        { error: 'Código de referido inválido' },
        { status: 400 }
      );
    }

    // Recompensas
    const REFERRER_REWARD = 500; // NUMA
    const REFERRED_REWARD = 300; // NUMA

    // Crear referral
    await sql`
      INSERT INTO referrals (referrer_id, referred_id, reward_paid, reward_amount)
      VALUES (${referrerId}, ${userId}, true, ${REFERRER_REWARD})
    `;

    // Actualizar balance del referrer
    await sql`
      UPDATE users 
      SET balance_numa = balance_numa + ${REFERRER_REWARD},
          updated_at = NOW()
      WHERE id = ${referrerId}
    `;

    // Actualizar balance del referee
    const userBalance = await sql`
      UPDATE users 
      SET balance_numa = balance_numa + ${REFERRED_REWARD},
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING balance_numa, balance_wld
    `;

    // Crear transacciones
    await sql`
      INSERT INTO transactions (user_id, type, description, amount, token, balance_after_numa, balance_after_wld)
      VALUES 
        (${referrerId}, 'referral_bonus', 'Bonus por referir amigo', ${REFERRER_REWARD}, 'NUMA', 
         (SELECT balance_numa FROM users WHERE id = ${referrerId}),
         (SELECT balance_wld FROM users WHERE id = ${referrerId})),
        (${userId}, 'referral_bonus', 'Bonus de bienvenida por referido', ${REFERRED_REWARD}, 'NUMA',
         ${userBalance.rows[0].balance_numa},
         ${userBalance.rows[0].balance_wld})
    `;

    return NextResponse.json({
      success: true,
      message: 'Código de referido aplicado exitosamente',
      rewards: {
        numa: REFERRED_REWARD,
        xp: 100,
      },
    });

  } catch (error) {
    console.error('Error applying referral:', error);
    return NextResponse.json(
      { error: 'Error al procesar referido' },
      { status: 500 }
    );
  }
}
