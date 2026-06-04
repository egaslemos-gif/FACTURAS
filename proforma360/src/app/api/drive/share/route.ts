import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeDriveWorkspace } from "@/lib/google/setup";
import { sharePayloadToDrive } from "@/lib/google/drive";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Não autorizado ou sessão expirada. Por favor, faça login novamente." },
        { status: 401 }
      );
    }

    const payload = await req.json();

    if (!payload || !payload.q || !payload.q.id) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    // 1. Ensure folders (Workspace)
    const { sharesFolderId } = await initializeDriveWorkspace(session as any);

    // 2. Name the file
    const fileName = `Proforma_${payload.q.quotation_number}_${Date.now()}.json`;

    // 3. Upload and make public
    const result = await sharePayloadToDrive(
      session.accessToken as string,
      sharesFolderId,
      payload,
      fileName
    );

    return NextResponse.json({ success: true, shareId: result.id });
  } catch (error: any) {
    console.error("API Drive Share Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao gerar o link partilhado no Google Drive.", details: error.message },
      { status: 500 }
    );
  }
}
