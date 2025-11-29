import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";

/**
 * POST /api/auth/login
 * Autenticar usuario con World ID y crear/actualizar en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, worldIdHash } = body;
    
    if (!walletAddress || !worldIdHash) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, worldIdHash" },
        { status: 400 }
      );
    }
    
    // Obtener o crear usuario
    const user = await getOrCreateUser(walletAddress, worldIdHash);
    
    return NextResponse.json({
      user,
      isNewUser: user.createdAt.getTime() === user.lastLoginAt.getTime(),
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
