/**
 * Helper for multipart uploads to Google Drive (allows uploading content + metadata in one request)
 */
async function multipartUpload(
  accessToken: string,
  metadata: any,
  fileContent: Blob | Uint8Array | string,
  contentType: string
): Promise<any> {
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  let body: Uint8Array;
  
  const metadataString = JSON.stringify(metadata);
  const metadataPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    metadataString +
    delimiter +
    `Content-Type: ${contentType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const closeBytes = encoder.encode(close_delim);

  if (fileContent instanceof Uint8Array) {
    body = new Uint8Array(metadataBytes.length + fileContent.length + closeBytes.length);
    body.set(metadataBytes, 0);
    body.set(fileContent, metadataBytes.length);
    body.set(closeBytes, metadataBytes.length + fileContent.length);
  } else if (fileContent instanceof Blob) {
    const arrayBuffer = await fileContent.arrayBuffer();
    const contentBytes = new Uint8Array(arrayBuffer);
    body = new Uint8Array(metadataBytes.length + contentBytes.length + closeBytes.length);
    body.set(metadataBytes, 0);
    body.set(contentBytes, metadataBytes.length);
    body.set(closeBytes, metadataBytes.length + contentBytes.length);
  } else {
    const contentBytes = encoder.encode(fileContent);
    body = new Uint8Array(metadataBytes.length + contentBytes.length + closeBytes.length);
    body.set(metadataBytes, 0);
    body.set(contentBytes, metadataBytes.length);
    body.set(closeBytes, metadataBytes.length + contentBytes.length);
  }

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: body as any,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload Failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Updates an existing file in Google Drive via multipart
 */
async function multipartUpdate(
  accessToken: string,
  fileId: string,
  fileContent: Uint8Array,
  contentType: string
): Promise<any> {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: fileContent as any,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Update Failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Uploads or updates the SQLite database backup to Google Drive
 */
export async function backupDatabaseToDrive(
  accessToken: string,
  folderId: string,
  dbData: Uint8Array,
  existingFileId?: string | null
): Promise<{ id: string; size: number }> {
  
  if (existingFileId) {
    // Try to update existing
    try {
      const res = await multipartUpdate(accessToken, existingFileId, dbData, "application/vnd.sqlite3");
      if (res.id) return { id: res.id, size: dbData.length };
    } catch (error) {
      console.warn("Failed to update existing backup, will create a new one", error);
    }
  }

  // Create new
  const metadata = {
    name: "proforma360.db",
    parents: [folderId],
    mimeType: "application/vnd.sqlite3",
  };

  const res = await multipartUpload(accessToken, metadata, dbData, "application/vnd.sqlite3");
  return { id: res.id, size: dbData.length };
}

/**
 * Downloads a file from Google Drive
 */
export async function downloadFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<Uint8Array> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file from Drive: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Find the latest backup file in a given folder
 */
export async function findLatestBackup(
  accessToken: string,
  folderId: string
): Promise<{ id: string; name: string; createdTime: string } | null> {
  const q = `'${folderId}' in parents and name='proforma360.db' and trashed=false`;
  
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=createdTime desc&spaces=drive&fields=files(id,name,createdTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Uploads a generated PDF Quotation
 */
export async function uploadPdfToDrive(
  accessToken: string,
  folderId: string,
  pdfBytes: Uint8Array,
  fileName: string
): Promise<{ id: string; webViewLink: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: "application/pdf",
  };

  // For PDF we might want to request webViewLink back so we can link to it
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  let body: Uint8Array;
  
  const metadataString = JSON.stringify(metadata);
  const metadataPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    metadataString +
    delimiter +
    `Content-Type: application/pdf\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const closeBytes = encoder.encode(close_delim);

  body = new Uint8Array(metadataBytes.length + pdfBytes.length + closeBytes.length);
  body.set(metadataBytes, 0);
  body.set(pdfBytes, metadataBytes.length);
  body.set(closeBytes, metadataBytes.length + pdfBytes.length);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: body as any,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PDF Upload Failed (${res.status}): ${errText}`);
  }

  return res.json();
}
