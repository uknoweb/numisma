import { NextRequest, NextResponse } from "next/server";

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

    // TODO: Implementar lógica de base de datos
    // 1. Verificar que el usuario no haya usado un código antes
    // 2. Verificar que el referrer existe
    // 3. Crear registro en tabla referrals
    // 4. Actualizar balances (referrer y referee)
    // 5. Crear transacciones de recompensa
    // 6. Incrementar stats para achievements

    /*
    Pseudo-código para implementación con DB:

    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Ya has usado un código de referido' },
        { status: 400 }
      );
    }

    const { data: referrer } = await supabase
      .from('users')
      .select('*')
      .eq('id', referrerId)
      .single();

    if (!referrer) {
      return NextResponse.json(
        { error: 'Código de referido inválido' },
        { status: 400 }
      );
    }

    // Crear referral
    await supabase.from('referrals').insert({
      referrer_user_id: referrerId,
      referred_user_id: userId,
      code,
      reward_claimed: true,
      created_at: new Date(),
    });

    // Actualizar balance del referrer
    await supabase.rpc('increment_balance', {
      user_id: referrerId,
      amount: REFERRAL_REWARDS.forReferrer.numa,
    });

    // Actualizar balance del referee
    await supabase.rpc('increment_balance', {
      user_id: userId,
      amount: REFERRAL_REWARDS.forReferred.numa,
    });

    // Crear transacciones
    await supabase.from('transactions').insert([
      {
        user_id: referrerId,
        type: 'referral_bonus',
        amount: REFERRAL_REWARDS.forReferrer.numa,
        description: 'Bonus por referir amigo',
      },
      {
        user_id: userId,
        type: 'referral_bonus',
        amount: REFERRAL_REWARDS.forReferred.numa,
        description: 'Bonus de bienvenida por referido',
      },
    ]);
    */

    // Respuesta mock para desarrollo
    return NextResponse.json({
      success: true,
      message: 'Código de referido aplicado exitosamente',
      rewards: {
        numa: 300,
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
