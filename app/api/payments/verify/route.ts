import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/payments/verify
 * Verificar pago de MiniKit y actualizar membresía del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      transactionId,
      amount,
      tier, // 'plus' | 'vip'
      duration, // meses de membresía
      reference,
    } = body;

    // Validaciones
    if (!userId || !transactionId || !amount || !tier || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // TODO: Verificar transacción on-chain
    // En producción, verificar que la transacción existe en World Chain
    // y que el monto es correcto antes de actualizar la membresía
    
    // Calcular nueva fecha de expiración
    const now = new Date();
    const currentExpiry = user[0].membershipExpiresAt 
      ? new Date(user[0].membershipExpiresAt)
      : now;
    
    // Si la membresía actual está vigente, extender desde la fecha de expiración
    // Si no, empezar desde ahora
    const startDate = currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(startDate.getTime() + duration * 30 * 24 * 60 * 60 * 1000);

    // Calcular meses consecutivos
    const isSameTier = user[0].membershipTier === tier;
    const wasActive = user[0].membershipExpiresAt && new Date(user[0].membershipExpiresAt) > now;
    const newConsecutiveMonths = isSameTier && wasActive
      ? user[0].membershipConsecutiveMonths + duration
      : duration;

    // Actualizar usuario
    const updatedUser = await db
      .update(users)
      .set({
        membershipTier: tier,
        membershipStartedAt: user[0].membershipStartedAt || now,
        membershipExpiresAt: expiresAt,
        membershipMonthsPaid: user[0].membershipMonthsPaid + duration,
        membershipConsecutiveMonths: newConsecutiveMonths,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();

    // Registrar transacción
    await db.insert(transactions).values({
      userId,
      type: "membership",
      description: `Membresía ${tier.toUpperCase()} - ${duration} ${duration === 1 ? 'mes' : 'meses'}`,
      amount: parseFloat(amount),
      token: "WLD",
      balanceAfterNuma: user[0].balanceNuma,
      balanceAfterWld: user[0].balanceWld,
      metadata: {
        transactionId,
        reference,
        tier,
        duration,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
      message: `Membresía ${tier.toUpperCase()} activada por ${duration} ${duration === 1 ? 'mes' : 'meses'}`,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
