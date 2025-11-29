import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * API Route para desuscribir de notificaciones push
 * POST /api/notifications/unsubscribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Subscription endpoint required' },
        { status: 400 }
      );
    }

    // Eliminar suscripción de la base de datos
    console.log('[Push Unsubscribe]', {
      endpoint: subscription.endpoint,
    });

    // TODO: Eliminar de tabla push_subscriptions
    // await sql`
    //   DELETE FROM push_subscriptions
    //   WHERE endpoint = ${subscription.endpoint}
    // `;

    return NextResponse.json({ 
      success: true,
      message: 'Subscription removed successfully'
    });

  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
