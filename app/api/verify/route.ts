import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Verificar World ID proof
 * Se llama desde el frontend después de MiniKit.verify()
 */

interface VerifyRequest {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: 'orb' | 'device';
  action: string;
  signal: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // Validar que tengamos todos los campos necesarios
    if (!body.proof || !body.merkle_root || !body.nullifier_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar con la API de Worldcoin
    const verifyResponse = await fetch(
      `https://developer.worldcoin.org/api/v2/verify/${process.env.NEXT_PUBLIC_WORLD_APP_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof: body.proof,
          merkle_root: body.merkle_root,
          nullifier_hash: body.nullifier_hash,
          verification_level: body.verification_level,
          action: body.action,
          signal: body.signal,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verifyData.detail || verifyData.code || 'Verification failed' 
        },
        { status: 400 }
      );
    }

    // TODO: Guardar nullifier_hash en DB para evitar reutilización
    // await db.worldIdVerifications.create({
    //   nullifier_hash: body.nullifier_hash,
    //   verification_level: body.verification_level,
    //   verified_at: new Date(),
    // });

    // Verificación exitosa
    return NextResponse.json({
      success: true,
      verification_level: body.verification_level,
      nullifier_hash: body.nullifier_hash,
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
