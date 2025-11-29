import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/positions/update/:positionId
 * Actualizar una posición existente (precio actual, PnL, estado)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { positionId: string } }
) {
  try {
    const { positionId } = params;
    const body = await request.json();
    
    const updatedPosition = await db
      .update(positions)
      .set({
        currentPrice: body.currentPrice,
        pnl: body.pnl,
        status: body.status,
        closedAt: body.status === "closed" || body.status === "liquidated" 
          ? new Date() 
          : null,
      })
      .where(eq(positions.id, positionId))
      .returning();
    
    if (updatedPosition.length === 0) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ position: updatedPosition[0] });
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/positions/update/:positionId
 * Eliminar una posición (solo para testing/admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { positionId: string } }
) {
  try {
    const { positionId } = params;
    
    const deletedPosition = await db
      .delete(positions)
      .where(eq(positions.id, positionId))
      .returning();
    
    if (deletedPosition.length === 0) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      position: deletedPosition[0] 
    });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
