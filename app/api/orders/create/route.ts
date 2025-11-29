import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

/**
 * API Route: Crear orden avanzada (SL/TP/Trailing)
 * POST /api/orders/create
 */
export async function POST(request: NextRequest) {
  try {
    const order = await request.json();

    const { userId, positionId, type, triggerPrice, triggerType, percentage, trailingPercentage, status } = order;

    if (!userId || !positionId || !type || !status) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la posición existe y está abierta
    const position = await sql`
      SELECT * FROM positions 
      WHERE id = ${positionId} 
        AND user_id = ${userId}
        AND status = 'open'
    `;

    if (position.rows.length === 0) {
      return NextResponse.json(
        { error: 'Posición no encontrada o ya cerrada' },
        { status: 404 }
      );
    }

    const currentPrice = position.rows[0].current_price;

    // Crear orden
    const newOrder = await sql`
      INSERT INTO advanced_orders (
        user_id,
        position_id,
        order_type,
        trigger_price,
        trigger_type,
        percentage,
        trailing_percentage,
        highest_price,
        lowest_price,
        current_trigger_price,
        status
      )
      VALUES (
        ${userId},
        ${positionId},
        ${type},
        ${triggerPrice || null},
        ${triggerType || 'mark'},
        ${percentage || null},
        ${trailingPercentage || null},
        ${type === 'trailing_stop' ? currentPrice : null},
        ${type === 'trailing_stop' ? currentPrice : null},
        ${type === 'trailing_stop' ? triggerPrice : null},
        ${status}
      )
      RETURNING id
    `;

    // Log para analytics
    await sql`
      INSERT INTO analytics_events (user_id, event_name, event_data)
      VALUES (
        ${userId},
        ${`order_${type}_created`},
        ${JSON.stringify({ orderId: newOrder.rows[0].id, positionId })}
      )
    `;

    return NextResponse.json({
      success: true,
      orderId: newOrder.rows[0].id,
      message: `Orden ${type} creada exitosamente`,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
