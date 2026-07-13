import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeDriveWorkspace } from "@/lib/google/setup";
import { findLatestBackup, downloadFileFromDrive } from "@/lib/google/drive";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { backupsFolderId } = await initializeDriveWorkspace(session as any);

    const latestBackup = await findLatestBackup(session.accessToken as string, backupsFolderId);

    if (!latestBackup) {
      return NextResponse.json({ error: "Nenhum backup encontrado na cloud." }, { status: 404 });
    }

    const fileData = await downloadFileFromDrive(session.accessToken as string, latestBackup.id);

    if (!fileData?.length || fileData.length < 100) {
      return NextResponse.json({ error: "O backup na cloud está vazio ou corrompido." }, { status: 422 });
    }

    return new NextResponse(fileData as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": "attachment; filename=\"proforma360.db\"",
        "X-Backup-Date": latestBackup.createdTime
      }
    });

  } catch (error: any) {
    console.error("API Drive Restore Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao restaurar do Google Drive.", details: error.message },
      { status: 500 }
    );
  }
}
