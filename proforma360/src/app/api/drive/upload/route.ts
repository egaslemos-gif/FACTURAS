import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeDriveWorkspace } from "@/lib/google/setup";
import { uploadPdfToDrive } from "@/lib/google/drive";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Não autorizado ou sessão expirada. Por favor, faça login novamente." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    const fileName = formData.get("fileName") as string;

    if (!file || !fileName) {
      return NextResponse.json({ error: "Ficheiro não fornecido." }, { status: 400 });
    }

    // Converter o Blob para Uint8Array para manter compatibilidade com a função existente
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // 1. Assegurar as pastas (Workspace)
    const { pdfsFolderId } = await initializeDriveWorkspace(session as any);

    // 2. Fazer o Upload do ficheiro
    const result = await uploadPdfToDrive(
      session.accessToken as string,
      pdfsFolderId,
      pdfBytes,
      fileName
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("API Drive Upload Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao guardar no Google Drive.", details: error.message },
      { status: 500 }
    );
  }
}
