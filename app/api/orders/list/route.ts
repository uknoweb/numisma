import { NextRequest, NextResponse } from "next/server";

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

    // TODO: Implementar consulta a base de datos
    /*
    const { data: orders, error } = await supabase
      .from('advanced_orders')
      .select('*')
      .eq('position_id', positionId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        positionId: o.position_id,
        type: o.type,
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
    */

    // Respuesta mock para desarrollo
    return NextResponse.json({
      orders: [],
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}
