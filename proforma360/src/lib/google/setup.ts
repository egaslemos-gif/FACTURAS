import { Session } from "next-auth";

/**
 * Ensures a folder exists in Google Drive. If it doesn't, creates it.
 */
export async function ensureFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const searchData = await searchRes.json();
  if (searchData.error) {
    console.error("Google Drive API Error (Search Folder):", searchData.error);
    throw new Error(`Drive API Error: ${searchData.error.message || JSON.stringify(searchData.error)}`);
  }

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  const createData = await createRes.json();
  if (createData.error) {
    console.error("Google Drive API Error (Create Folder):", createData.error);
    throw new Error(`Drive API Error: ${createData.error.message || JSON.stringify(createData.error)}`);
  }
  return createData.id;
}

/**
 * First time setup logic:
 * Creates the main 'Proforma360' folder, and subfolders 'Backups' and 'PDFs'
 */
export async function initializeDriveWorkspace(session: Session) {
  const accessToken = session.accessToken;

  // 1. Create root folder
  const rootFolderId = await ensureFolder(accessToken, "Proforma360");

  // 2. Create subfolders
  const backupsFolderId = await ensureFolder(accessToken, "Backups", rootFolderId);
  const pdfsFolderId = await ensureFolder(accessToken, "PDFs", rootFolderId);

  return {
    rootFolderId,
    backupsFolderId,
    pdfsFolderId,
  };
}
