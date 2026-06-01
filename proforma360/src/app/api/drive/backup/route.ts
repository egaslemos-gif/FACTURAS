import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeDriveWorkspace } from "@/lib/google/setup";
import { backupDatabaseToDrive, findLatestBackup } from "@/lib/google/drive";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "Ficheiro da base de dados não fornecido." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const dbBytes = new Uint8Array(arrayBuffer);

    const { backupsFolderId } = await initializeDriveWorkspace(session as any);

    const latestBackup = await findLatestBackup(session.accessToken as string, backupsFolderId);

    const result = await backupDatabaseToDrive(
      session.accessToken as string,
      backupsFolderId,
      dbBytes,
      latestBackup?.id
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("API Drive Backup Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao fazer backup no Google Drive.", details: error.message },
      { status: 500 }
    );
  }
}
