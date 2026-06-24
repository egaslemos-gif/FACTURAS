import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeDriveWorkspace } from "@/lib/google/setup";
import { findLatestBackup } from "@/lib/google/drive";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { backupsFolderId } = await initializeDriveWorkspace(session as any);

    const latestBackup = await findLatestBackup(session.accessToken as string, backupsFolderId);

    if (!latestBackup) {
      return NextResponse.json({ lastSyncDate: null }, { status: 200 });
    }

    return NextResponse.json({ 
      lastSyncDate: latestBackup.createdTime 
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Drive Status Error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao verificar o status no Google Drive.", details: error.message },
      { status: 500 }
    );
  }
}
