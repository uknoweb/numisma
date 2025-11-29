import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * API Route: Obtener órdenes de una posición
 * GET /api/orders/list?positionId=123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const positionId = searchParams.get('positionId');

    if (!positionId) {
      return NextResponse.json(
        { error: 'positionId es requerido' },
        { status: 400 }
      );
    }

    const orders = await sql`
      SELECT * FROM advanced_orders
      WHERE position_id = ${positionId}
        AND status IN ('active', 'pending')
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      orders: orders.rows.map(o => ({
        id: o.id,
        positionId: o.position_id,
        type: o.order_type,
        triggerPrice: o.trigger_price,
        triggerType: o.trigger_type,
        percentage: o.percentage,
        trailingPercentage: o.trailing_percentage,
        highestPrice: o.highest_price,
        lowestPrice: o.lowest_price,
        currentTriggerPrice: o.current_trigger_price,
        status: o.status,
        createdAt: o.created_at,
        triggeredAt: o.triggered_at,
      })),
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}
