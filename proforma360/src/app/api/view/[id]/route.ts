import { NextRequest, NextResponse } from "next/server";
import { fetchSharedProposal } from "@/lib/google/share-fetch";

/**
 * Public API route that proxies Google Drive file downloads.
 * Uses the shared fetchSharedProposal utility for reliability.
 * 
 * This route can be used by external clients or as an alternative
 * access point for shared proposals.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const data = await fetchSharedProposal(id);

  if (!data) {
    return NextResponse.json(
      { error: "Proposta não encontrada ou ficheiro inacessível." },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
