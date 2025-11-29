import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/transactions/:userId
 * Obtener historial de transacciones de un usuario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type"); // Filtrar por tipo
    
    // Construir condiciones
    const conditions = type
      ? and(eq(transactions.userId, userId), eq(transactions.type, type))
      : eq(transactions.userId, userId);
    
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    
    return NextResponse.json({ transactions: userTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions/:userId
 * Crear una nueva transacción
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    
    const newTransaction = await db.insert(transactions).values({
      userId,
      type: body.type,
      description: body.description,
      amount: body.amount,
      token: body.token,
      balanceAfterNuma: body.balanceAfterNuma,
      balanceAfterWld: body.balanceAfterWld,
      metadata: body.metadata || null,
    }).returning();
    
    return NextResponse.json(
      { transaction: newTransaction[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
