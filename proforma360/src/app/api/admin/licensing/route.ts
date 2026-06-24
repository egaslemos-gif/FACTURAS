import { NextResponse } from "next/server";
import * as jose from 'jose';
import { FALLBACK_PRIVATE_JWK } from "@/lib/subscriptions/cryptoKeys";
import { resolveRuntimeNamespace } from "@/lib/runtime/runtimeNamespace";

/**
 * Lightweight Control-Plane: License Issuance
 * In a real scenario, this is protected by Admin Middleware and pulls data from
 * the cloud DB to issue a valid offline license payload for the client.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, plan, deviceId } = body;

    if (!userId || !plan || !deviceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Example logic: Allow 7 days of offline usage
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (7 * 24 * 60 * 60); // 7 days

    const payload = {
      userId,
      plan,
      deviceId,
      runtimeNamespace: resolveRuntimeNamespace(userId),
      licenseVersion: 1, // To invalidate old payload formats
      issuedAt,
      expiresAt
    };

    // Sign with Private Key
    const privateKey = await jose.importJWK(FALLBACK_PRIVATE_JWK, 'ES256');
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(privateKey);

    return NextResponse.json({
      success: true,
      license: jwt
    });

  } catch (error) {
    console.error("[ControlPlane] Failed to issue license:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
