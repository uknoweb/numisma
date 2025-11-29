import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: Obtener lista de referidos
 * GET /api/referrals/list?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // TODO: Implementar consulta a base de datos
    /*
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:users!referred_user_id(
          id,
          wallet_address,
          created_at
        )
      `)
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      count: referrals.length,
      referrals: referrals.map(r => ({
        userId: r.referred_user.id,
        walletAddress: r.referred_user.wallet_address,
        createdAt: r.created_at,
        rewardClaimed: r.reward_claimed,
      })),
    });
    */

    // Respuesta mock para desarrollo
    return NextResponse.json({
      count: 0,
      referrals: [],
    });

  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Error al obtener referidos' },
      { status: 500 }
    );
  }
}
