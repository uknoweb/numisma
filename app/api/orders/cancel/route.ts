import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * API Route: Cancelar orden avanzada
 * POST /api/orders/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'orderId y userId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la orden existe y está activa
    const order = await sql`
      SELECT * FROM advanced_orders
      WHERE id = ${orderId}
        AND user_id = ${userId}
        AND status IN ('active', 'pending')
    `;

    if (order.rows.length === 0) {
      return NextResponse.json(
        { error: 'Orden no encontrada o ya ejecutada' },
        { status: 404 }
      );
    }

    // Cancelar orden
    await sql`
      UPDATE advanced_orders
      SET status = 'cancelled',
          cancelled_at = NOW()
      WHERE id = ${orderId}
    `;

    // Log para analytics
    await sql`
      INSERT INTO analytics_events (user_id, event_name, event_data)
      VALUES (
        ${userId},
        ${`order_${order.rows[0].order_type}_cancelled`},
        ${JSON.stringify({ orderId })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Orden cancelada exitosamente',
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Error al cancelar orden' },
      { status: 500 }
    );
  }
}
