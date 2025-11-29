import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

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

    const referrals = await sql`
      SELECT 
        r.id,
        r.referred_id as user_id,
        r.reward_paid,
        r.reward_amount,
        r.created_at,
        u.wallet_address,
        u.created_at as user_created_at
      FROM referrals r
      JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ${userId}
      ORDER BY r.created_at DESC
    `;

    return NextResponse.json({
      count: referrals.rows.length,
      referrals: referrals.rows.map(r => ({
        userId: r.user_id,
        walletAddress: r.wallet_address,
        createdAt: r.created_at,
        rewardClaimed: r.reward_paid,
        rewardAmount: r.reward_amount,
      })),
    });

  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Error al obtener referidos' },
      { status: 500 }
    );
  }
}
