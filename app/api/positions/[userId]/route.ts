import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";
import { sql } from "@vercel/postgres";

/**
 * GET /api/positions/:userId
 * Obtener todas las posiciones de un usuario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'open' | 'closed' | 'liquidated'
    
    let query = db
      .select()
      .from(positions)
      .where(sql`${positions.userId} = ${userId}`);
    
    // Filtrar por estado si se proporciona
    if (status) {
      query = query.where(sql`${positions.status} = ${status}` as any);
    }
    
    const userPositions = await query.orderBy(sql`${positions.createdAt} DESC`);
    
    return NextResponse.json({ positions: userPositions });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/positions/:userId
 * Crear una nueva posición
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    
    const newPosition = await db.insert(positions).values({
      userId,
      ...body,
    }).returning();
    
    return NextResponse.json({ position: newPosition[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating position:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
