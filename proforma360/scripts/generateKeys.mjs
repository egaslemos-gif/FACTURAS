import * as jose from 'jose';

async function generate() {
  const { publicKey, privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
  
  const publicJwk = await jose.exportJWK(publicKey);
  const privateJwk = await jose.exportJWK(privateKey);
  
  console.log("=== PUBLIC JWK ===");
  console.log(JSON.stringify(publicJwk, null, 2));
  console.log("\n=== PRIVATE JWK ===");
  console.log(JSON.stringify(privateJwk, null, 2));
}

generate();
