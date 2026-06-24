/**
 * Gera um Hash de identidade estável para o isolamento do Runtime.
 * Utiliza SHA-256 via Web Crypto API nativa do browser para máxima segurança e performance.
 */
export async function generateTenantHash(provider: string, providerAccountId: string): Promise<string> {
  const appSalt = "proforma360_b2b_v1_salt"; 
  const rawIdentity = `${provider}:${providerAccountId}:${appSalt}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawIdentity);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Legacy synchronous resolution for API routes and snapshots.
 * Returns a stable base64-encoded string for the given userId.
 */
export function resolveRuntimeNamespace(userId: string): string {
  if (typeof Buffer !== 'undefined') {
    return 'tenant_' + Buffer.from(userId).toString('base64').replace(/=/g, '');
  }
  return 'tenant_' + btoa(userId).replace(/=/g, '');
}

export function resolveLicenseStorageKey(userId: string): string {
  return resolveRuntimeNamespace(userId) + '_offline_license';
}

let activeTenantHash: string | null = null;

export function setActiveTenantHash(hash: string | null) {
  activeTenantHash = hash;
}

export function getActiveTenantHash(): string | null {
  return activeTenantHash;
}
