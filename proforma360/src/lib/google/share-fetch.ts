/**
 * Fetches a publicly shared proposal JSON from Google Drive.
 * 
 * Tries multiple Google Drive download endpoints for maximum reliability.
 * Handles HTML responses (CAPTCHA, virus scan), timeouts, and redirects.
 * 
 * This function is designed to be called from server-side code only
 * (API routes, Server Components, etc.)
 */
export async function fetchSharedProposal(driveFileId: string): Promise<any | null> {
  if (!driveFileId || driveFileId.length < 10) {
    console.error("[fetchSharedProposal] Invalid Drive file ID:", driveFileId);
    return null;
  }

  // Try multiple Google Drive download endpoints in order of reliability
  const endpoints = [
    // 1. New Google Drive content endpoint (most reliable since 2024)
    `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download&confirm=t`,
    // 2. Classic direct download with confirm bypass
    `https://drive.google.com/uc?export=download&id=${driveFileId}&confirm=t`,
    // 3. Classic direct download without confirm
    `https://drive.google.com/uc?export=download&id=${driveFileId}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        cache: "no-store",
        headers: {
          // Browser-like User-Agent to avoid being blocked by Google
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9,pt;q=0.8",
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[fetchSharedProposal] ${url} returned ${res.status}`);
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      // Skip HTML responses (virus scan / CAPTCHA / error pages from Google)
      const trimmed = text.trimStart();
      if (
        trimmed.startsWith("<!") ||
        trimmed.startsWith("<html") ||
        trimmed.startsWith("<HTML") ||
        trimmed.startsWith("<head") ||
        contentType.includes("text/html")
      ) {
        console.warn(
          `[fetchSharedProposal] Received HTML from ${url} (content-type: ${contentType}), skipping`
        );
        continue;
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(text);

        // Basic validation: ensure it has the expected proposal structure
        if (!data.q || !data.cmp) {
          console.warn(
            `[fetchSharedProposal] JSON from ${url} missing expected fields (q, cmp)`
          );
          continue;
        }

        console.log(`[fetchSharedProposal] Successfully fetched from ${url}`);
        return data;
      } catch (parseError) {
        console.error(
          `[fetchSharedProposal] Failed to parse JSON from ${url}:`,
          text.substring(0, 300)
        );
        continue;
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn(`[fetchSharedProposal] Timeout for ${url}`);
      } else {
        console.error(
          `[fetchSharedProposal] Error fetching ${url}:`,
          error.message
        );
      }
      continue;
    }
  }

  console.error(
    `[fetchSharedProposal] All endpoints failed for Drive file ID: ${driveFileId}`
  );
  return null;
}
