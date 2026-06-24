/**
 * Asymmetric Keys for Offline Licensing
 * 
 * IMPORTANT: In production, `PRIVATE_JWK` MUST be injected via environment variables
 * on the server, and must NEVER be bundled with the client.
 * 
 * `PUBLIC_JWK` is safe to bundle with the client to allow offline verification of 
 * signed license payloads.
 * 
 * We use ECDSA (ES256) because it produces very small signatures, ideal for localStorage.
 */

export const FALLBACK_PUBLIC_JWK = {
  kty: "EC",
  x: "gZK4MXtCgMiI1_CfRKrNa9Ozmuk2M6g5Y-Y2alX9YL8",
  y: "B-Qntlbj3rZZdLcYzBF_j53hFHFYEMtj4aS_W4Pknug",
  crv: "P-256",
  ext: true,
};

// DO NOT EXPOSE TO CLIENT. Server-only use.
export const FALLBACK_PRIVATE_JWK = {
  kty: "EC",
  x: "gZK4MXtCgMiI1_CfRKrNa9Ozmuk2M6g5Y-Y2alX9YL8",
  y: "B-Qntlbj3rZZdLcYzBF_j53hFHFYEMtj4aS_W4Pknug",
  crv: "P-256",
  d: "qYifKq3CdJYdUyR7vjYRs9sYfAfEX2rzfCgCK0ABKIM",
  ext: true,
};
