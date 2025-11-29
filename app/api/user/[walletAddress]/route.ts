import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "@vercel/postgres";

/**
 * GET /api/user/:walletAddress
 * Obtener información de un usuario por su wallet address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params;
    
    const user = await db
      .select()
      .from(users)
      .where(sql`${users.walletAddress} = ${walletAddress}`)
      .limit(1);
    
    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/:walletAddress
 * Actualizar información de un usuario
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params;
    const body = await request.json();
    
    // Validar que el usuario existe
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`${users.walletAddress} = ${walletAddress}`)
      .limit(1);
    
    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Actualizar usuario
    const updatedUser = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(sql`${users.walletAddress} = ${walletAddress}`)
      .returning();
    
    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
