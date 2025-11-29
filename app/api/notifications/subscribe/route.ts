import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * API Route para suscribir a notificaciones push
 * POST /api/notifications/subscribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription object required' },
        { status: 400 }
      );
    }

    // Guardar suscripción en la base de datos
    // Por ahora solo log, después implementar tabla de suscripciones
    console.log('[Push Subscribe]', {
      userId,
      endpoint: subscription.endpoint,
    });

    // TODO: Guardar en tabla push_subscriptions
    // await sql`
    //   INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
    //   VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
    //   ON CONFLICT (endpoint) DO UPDATE
    //   SET user_id = ${userId}, updated_at = NOW()
    // `;

    return NextResponse.json({ 
      success: true,
      message: 'Subscription saved successfully'
    });

  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
