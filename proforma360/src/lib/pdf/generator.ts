import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, PDFString } from "pdf-lib";
import { Company, Client, Quotation, QuotationItem } from "../types";
import { formatCurrency, formatDate } from "../utils";
import QRCode from "qrcode";
import pako from "pako";
import { documentSchemaRegistry } from "../documents/documentSchemaRegistry";
import { DocumentFieldMapper } from "../documents/documentFieldMapper";
import { DocumentRenderBudget } from "../documents/documentRenderBudget";
import { BusinessProfile } from "../documents/businessProfiles";

export interface PDFData {
  company: Company;
  client: Client;
  quotation: Quotation;
  items: QuotationItem[];
}

// Helper to embed Base64 image
async function embedImage(pdfDoc: PDFDocument, base64Url: string | null | undefined) {
  if (!base64Url) return null;
  try {
    const isPng = base64Url.startsWith("data:image/png");
    const isJpeg = base64Url.startsWith("data:image/jpeg") || base64Url.startsWith("data:image/jpg");
    
    if (!isPng && !isJpeg) return null;
    
    const base64Data = base64Url.split(',')[1];
    const binaryString = atob(base64Data);
    const imageBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i);
    }
    
    if (isPng) {
      return await pdfDoc.embedPng(imageBytes);
    } else {
      return await pdfDoc.embedJpg(imageBytes);
    }
  } catch (e) {
    console.error("Failed to embed image", e);
    return null;
  }
}

function drawCenteredText(page: PDFPage, text: string, cx: number, y: number, size: number, font: PDFFont, color: any) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}
// Helper to wrap text
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateQuotationPDF(data: PDFData): Promise<Uint8Array> {
  const { company, client, quotation, items } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();

  // Load fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load Images
  const logoImage = await embedImage(pdfDoc, company.logo_url);
  const stampImage = await embedImage(pdfDoc, company.stamp_url);
  const sigImage = await embedImage(pdfDoc, company.signature_url);

  const template = company.pdf_template || 'minimal';
  
  // Generate Magic Link QR Code
  let qrImage = null;
  try {
    const payload = JSON.stringify({ q: quotation, c: client, cmp: company, i: items });
    const compressed = pako.deflate(payload);
    const binString = Array.from(compressed, (byte) => String.fromCharCode(byte)).join('');
    const b64 = btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // We assume the origin is provided by window or we fallback to an absolute URL
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://proforma360.app';
    const magicLinkUrl = `${origin}/q?data=${b64}`;
    
    const qrDataUrl = await QRCode.toDataURL(magicLinkUrl, { margin: 1, color: { dark: '#000000', light: '#ffffff' } });
    qrImage = await embedImage(pdfDoc, qrDataUrl);
  } catch (e) {
    console.error("Failed to generate QR Code", e);
  }

  const schemaContext = (quotation.document_context || "GENERAL") as BusinessProfile;
  const schemaVersion = quotation.schema_version || "v1";
  const schema = documentSchemaRegistry.get(schemaContext, schemaVersion);

  if (template === 'modern') {
    await renderModernTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, qrImage, schema });
  } else if (template === 'corporate') {
    await renderCorporateTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, qrImage, schema });
  } else {
    await renderMinimalTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, qrImage, schema });
  }

  // Footer text for all templates
  if (company.footer_text) {
    const lines = company.footer_text.split('\n');
    let currentY = 45;
    for (const line of lines) {
      const w = fontRegular.widthOfTextAtSize(line, 8);
      page.drawText(line, {
        x: (width - w) / 2,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 10;
    }
  }

  // Generated By watermark / Brand Visibility
  if (company.show_branding !== false) {
    const brandColor = rgb(156/255, 163/255, 175/255); // #9CA3AF
    const lineColor = rgb(229/255, 231/255, 235/255); // #E5E7EB
    
    // Draw subtle top border
    page.drawLine({
      start: { x: 50, y: 35 },
      end: { x: width - 50, y: 35 },
      thickness: 1,
      color: lineColor
    });

    const watermarkText = "Generated with Proforma360 • Commercial Operating Workspace";
    const textWidth = fontRegular.widthOfTextAtSize(watermarkText, 10);
    const linkX = (width - textWidth) / 2;
    const linkY = 20;
    
    page.drawText(watermarkText, { 
      x: linkX, 
      y: linkY, 
      size: 10, 
      font: fontRegular, 
      color: brandColor 
    });

    const linkAnnotation = pdfDoc.context.register(
      pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [linkX, linkY - 2, linkX + textWidth, linkY + 10],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of('https://proforma360.vercel.app'),
        },
      })
    );
    page.node.addAnnot(linkAnnotation);
  }

  return await pdfDoc.save();
}

// ==========================================
// MINIMAL TEMPLATE
// ==========================================
async function renderMinimalTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, schema } = params;
  const { company, client, quotation, items } = data;

  const textColor = rgb(15/255, 23/255, 42/255); // slate-900
  const subtextColor = rgb(148/255, 163/255, 184/255); // slate-400
  const mutedColor = rgb(100/255, 116/255, 139/255); // slate-500
  const companyMuted = rgb(71/255, 85/255, 105/255); // slate-600
  const lineGray = rgb(226/255, 232/255, 240/255); // slate-200

  // 1. A thick slate divider at the top
  page.drawLine({
    start: { x: 50, y: height - 30 },
    end: { x: width - 50, y: height - 30 },
    thickness: 4,
    color: textColor,
  });

  let cursorY = height - 55;

  // Header: Company Logo & Info
  if (logoImage) {
    const dims = logoImage.scale(0.5);
    const scaleFactor = Math.min(150 / dims.width, 45 / dims.height, 1);
    page.drawImage(logoImage, {
      x: 50,
      y: cursorY - (dims.height * scaleFactor) + 10,
      width: dims.width * scaleFactor,
      height: dims.height * scaleFactor,
    });
    cursorY -= (dims.height * scaleFactor) + 12;
  } else {
    page.drawText(company.name.toUpperCase(), {
      x: 50, y: cursorY, size: 18, font: fontBold, color: textColor,
    });
    cursorY -= 16;
  }
  
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 50, y: cursorY, size: 8.5, font: fontBold, color: companyMuted });
    cursorY -= 12;
  }
  
  if (company.address) {
    const lines = company.address.split("\n");
    lines.forEach((line: string) => {
      const wrapped = wrapText(line, 250, fontRegular, 8);
      wrapped.forEach((wLine: string) => {
        page.drawText(wLine, { x: 50, y: cursorY, size: 8, font: fontRegular, color: mutedColor });
        cursorY -= 12;
      });
    });
  }

  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join("  •  ");
    page.drawText(contact, { x: 50, y: cursorY, size: 8, font: fontRegular, color: mutedColor });
  }

  // Header Right: Proforma Info (Grouped Metadata)
  let rightCursorY = height - 55;
  
  page.drawText("PROFORMA", { x: width - 200, y: rightCursorY, size: 24, font: fontBold, color: textColor });
  rightCursorY -= 10;
  page.drawText("P R O P O S T A   C O M E R C I A L", { x: width - 200, y: rightCursorY, size: 6.5, font: fontBold, color: subtextColor });
  
  rightCursorY -= 20;
  page.drawText(`Ref. ${quotation.quotation_number}`, { x: width - 200, y: rightCursorY, size: 10, font: fontBold, color: companyMuted });
  rightCursorY -= 14;
  page.drawText(`Emitido em ${formatDate(quotation.date)}`, { x: width - 200, y: rightCursorY, size: 8.5, font: fontRegular, color: mutedColor });
  rightCursorY -= 12;
  page.drawText(`Válido até ${formatDate(quotation.expiry_date)}`, { x: width - 200, y: rightCursorY, size: 8.5, font: fontRegular, color: mutedColor });

  cursorY = Math.min(cursorY, rightCursorY) - 24;

  // Client Info: Completely clean, no box, no grey bg
  let clientY = cursorY;
  page.drawText("PREPARADO PARA", { x: 50, y: clientY, size: 7.5, font: fontBold, color: subtextColor });
  clientY -= 14;
  page.drawText(client.name, { x: 50, y: clientY, size: 11, font: fontBold, color: textColor });

  if (client.tax_number) {
    clientY -= 12;
    page.drawText(`NUIT: ${client.tax_number}`, { x: 50, y: clientY, size: 8.5, font: fontRegular, color: mutedColor });
  }
  if (client.address) {
    clientY -= 12;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), 500, fontRegular, 8.5);
    if (wrapped.length > 0) {
      page.drawText(wrapped[0], { x: 50, y: clientY, size: 8.5, font: fontRegular, color: mutedColor });
    }
  }

  cursorY = clientY - 24;

  // Table Header (Minimal layout with simple lines)
  const tableTop = cursorY;
  page.drawLine({ start: { x: 50, y: tableTop }, end: { x: width - 50, y: tableTop }, thickness: 1, color: lineGray });

  cursorY -= 15;

  const itemFields = schema.itemFields;
  const descField = itemFields.find((f: any) => f.key === 'description');
  const otherFields = itemFields.filter((f: any) => f.key !== 'description');

  // Distribution of X coordinates
  const descWidth = 200;
  const startX = 50 + descWidth + 20; // 270
  const availableWidth = (width - 50) - startX;
  const colSpacing = availableWidth / otherFields.length;

  if (descField) {
    page.drawText(descField.label, { x: 50, y: cursorY, size: 9, font: fontBold, color: textColor });
  }

  otherFields.forEach((field: any, idx: number) => {
    const cx = startX + (idx * colSpacing) + (colSpacing / 2);
    drawCenteredText(page, field.label, cx, cursorY, 9, fontBold, textColor);
  });

  cursorY -= 10;
  page.drawLine({ start: { x: 50, y: cursorY }, end: { x: width - 50, y: cursorY }, thickness: 1, color: lineGray });

  cursorY -= 20;

  // Table Rows
  const renderBudget = new DocumentRenderBudget(otherFields.length + 1);

  for (const item of items) {
    renderBudget.recordRow();

    const descText = item.description || (item.dynamic_fields ? item.dynamic_fields['description'] : '');
    const rawLines = String(descText).split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, descWidth - 20, fontRegular, 9));
    });

    const rowHeight = descLines.length * 15 + 10;
    const rowStartY = cursorY + 10;
    const rowEndY = rowStartY - rowHeight;

    let textY = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 50, y: textY, size: 9, font: fontRegular, color: textColor });
      
      if (i === 0) {
        otherFields.forEach((field: any, idx: number) => {
          const cx = startX + (idx * colSpacing) + (colSpacing / 2);
          
          // Try to pull from standardized entity, then fallback to dynamic_fields
          let rawVal = (item as any)[field.key];
          if (rawVal === undefined && item.dynamic_fields) {
            rawVal = item.dynamic_fields[field.key];
          }

          const displayVal = DocumentFieldMapper.mapValue(rawVal, field);
          // Clean up currency symbols to keep table minimal
          const cleanVal = displayVal.replace("MZN", "").replace("€", "").trim();

          drawCenteredText(page, cleanVal, cx, textY, 9, fontRegular, textColor);
        });
      }
      textY -= 15;
    }
    cursorY = rowEndY - 10;
  }

  page.drawLine({ start: { x: 50, y: cursorY + 10 }, end: { x: width - 50, y: cursorY + 10 }, thickness: 1, color: lineGray });

  cursorY -= 15;

  // Summary Totals (Clean, no boxes)
  const summaryX = 350;
  page.drawText("Subtotal:", { x: summaryX, y: cursorY, size: 9, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.subtotal), { x: summaryX + 80, y: cursorY, size: 9, font: fontRegular, color: textColor });

  if (quotation.discount > 0) {
    cursorY -= 15;
    page.drawText("Desconto:", { x: summaryX, y: cursorY, size: 9, font: fontBold, color: textColor });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: summaryX + 80, y: cursorY, size: 9, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
  }

  cursorY -= 15;
  page.drawText("Total IVA:", { x: summaryX, y: cursorY, size: 9, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.vat_total), { x: summaryX + 80, y: cursorY, size: 9, font: fontRegular, color: textColor });

  cursorY -= 12;
  page.drawLine({ start: { x: summaryX, y: cursorY }, end: { x: width - 50, y: cursorY }, thickness: 1, color: lineGray });
  
  cursorY -= 15;
  page.drawText("Total Final:", { x: summaryX, y: cursorY, size: 11, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.grand_total), { x: summaryX + 80, y: cursorY, size: 11, font: fontBold, color: textColor });

  cursorY -= 40;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, textColor);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, textColor);
  
  // Signatures
  renderSignatures(page, width, height, stampImage, sigImage, fontRegular, quotation, params.qrImage);
}

// ==========================================
// MODERN TEMPLATE
// ==========================================
async function renderModernTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, schema } = params;
  const { company, client, quotation, items } = data;

  const indigoColor = rgb(30/255, 58/255, 138/255); // blue-900 
  const textColor = rgb(15/255, 23/255, 42/255); // slate-900
  const lightText = rgb(51/255, 65/255, 85/255); // slate-700
  const borderGray = rgb(203/255, 213/255, 225/255); // slate-300
  const bgBox = rgb(248/255, 250/255, 252/255); // slate-50
  const white = rgb(1, 1, 1);

  // 1. Top bar absolute edge
  page.drawRectangle({ x: 0, y: height - 16, width: width, height: 16, color: indigoColor });

  let cursorY = height - 60;
  const leftX = 50;

  // Header Right: Logo
  let rightCursorY = cursorY;
  if (logoImage) {
    const dims = logoImage.scale(0.5);
    const scaleFactor = Math.min(150 / dims.width, 60 / dims.height, 1);
    const finalWidth = dims.width * scaleFactor;
    const finalHeight = dims.height * scaleFactor;
    page.drawImage(logoImage, {
      x: width - 50 - finalWidth,
      y: rightCursorY - finalHeight + 15,
      width: finalWidth,
      height: finalHeight,
    });
    rightCursorY -= finalHeight + 40;
  } else {
    const compName = company.name.toUpperCase();
    const nameWidth = fontBold.widthOfTextAtSize(compName, 24);
    page.drawText(compName, { x: width - 50 - nameWidth, y: rightCursorY, size: 24, font: fontBold, color: textColor });
    rightCursorY -= 40;
  }

  // Header Left: PROFORMA and Metadata
  page.drawText("PROFORMA", { x: leftX, y: cursorY, size: 36, font: fontBold, color: textColor });
  cursorY -= 30;
  
  page.drawText("Referência:", { x: leftX, y: cursorY, size: 9, font: fontBold, color: lightText });
  page.drawText(quotation.quotation_number, { x: leftX + 80, y: cursorY, size: 9, font: fontBold, color: textColor });
  cursorY -= 14;
  page.drawText("Data emissão:", { x: leftX, y: cursorY, size: 9, font: fontBold, color: lightText });
  page.drawText(formatDate(quotation.date), { x: leftX + 80, y: cursorY, size: 9, font: fontRegular, color: textColor });
  cursorY -= 14;
  page.drawText("Válido até:", { x: leftX, y: cursorY, size: 9, font: fontBold, color: lightText });
  page.drawText(formatDate(quotation.expiry_date), { x: leftX + 80, y: cursorY, size: 9, font: fontRegular, color: textColor });
  
  cursorY -= 40;

  // Company and Client info - WITH BOXES
  const startBoxesY = Math.min(cursorY, rightCursorY);
  
  const boxWidth = (width - 120) / 2;
  const boxHeight = 110;

  // Draw From Box
  page.drawRectangle({ x: leftX, y: startBoxesY - boxHeight, width: boxWidth, height: boxHeight, color: bgBox, borderColor: borderGray, borderWidth: 1 });
  
  // Left: From
  let fromY = startBoxesY - 20;
  page.drawText("DE:", { x: leftX + 15, y: fromY, size: 8, font: fontBold, color: lightText });
  fromY -= 14;
  page.drawText(company.name, { x: leftX + 15, y: fromY, size: 11, font: fontBold, color: textColor });
  fromY -= 14;
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: leftX + 15, y: fromY, size: 9, font: fontRegular, color: lightText });
    fromY -= 12;
  }
  if (company.address) {
    const wrapped = wrapText(company.address.replace(/\n/g, ", "), boxWidth - 30, fontRegular, 9);
    wrapped.forEach((wLine: string) => {
      page.drawText(wLine, { x: leftX + 15, y: fromY, size: 9, font: fontRegular, color: lightText });
      fromY -= 12;
    });
  }
  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join("  •  ");
    page.drawText(contact, { x: leftX + 15, y: fromY, size: 9, font: fontRegular, color: lightText });
  }

  // Draw To Box
  page.drawRectangle({ x: leftX + boxWidth + 20, y: startBoxesY - boxHeight, width: boxWidth, height: boxHeight, color: bgBox, borderColor: borderGray, borderWidth: 1 });

  // Right: To
  let toY = startBoxesY - 20;
  page.drawText("PARA:", { x: leftX + boxWidth + 35, y: toY, size: 8, font: fontBold, color: lightText });
  toY -= 14;
  const clientName = client.name || quotation.client_name;
  page.drawText(clientName, { x: leftX + boxWidth + 35, y: toY, size: 11, font: fontBold, color: textColor });
  if (client.tax_number) {
    toY -= 14;
    page.drawText(`NUIT: ${client.tax_number}`, { x: leftX + boxWidth + 35, y: toY, size: 9, font: fontRegular, color: lightText });
  }
  if (client.address) {
    toY -= 12;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), boxWidth - 30, fontRegular, 9);
    wrapped.forEach((wLine: string) => {
      page.drawText(wLine, { x: leftX + boxWidth + 35, y: toY, size: 9, font: fontRegular, color: lightText });
      toY -= 12;
    });
  }

  cursorY = startBoxesY - boxHeight - 40;

  // Table Header
  page.drawRectangle({ x: 50, y: cursorY - 20, width: width - 100, height: 30, color: bgBox });
  page.drawLine({ start: { x: 50, y: cursorY + 10 }, end: { x: width - 50, y: cursorY + 10 }, thickness: 1, color: borderGray });
  const textY = cursorY - 5;
  
  const itemFields = schema.itemFields;
  const descField = itemFields.find((f: any) => f.key === 'description');
  const otherFields = itemFields.filter((f: any) => f.key !== 'description');

  const descWidth = 250;
  const startX = 60 + descWidth + 20; 
  const availableWidth = (width - 50) - startX;
  const colSpacing = availableWidth / otherFields.length;

  if (descField) {
    page.drawText(descField.label, { x: 60, y: textY, size: 9, font: fontBold, color: textColor });
  }

  otherFields.forEach((field: any, idx: number) => {
    const cx = startX + (idx * colSpacing) + (colSpacing / 2);
    drawCenteredText(page, field.label, cx, textY, 9, fontBold, textColor);
  });

  page.drawLine({ start: { x: 50, y: cursorY - 20 }, end: { x: width - 50, y: cursorY - 20 }, thickness: 1, color: borderGray });

  cursorY -= 35;

  // Table Rows
  const renderBudget = new DocumentRenderBudget(otherFields.length + 1);

  for (const item of items) {
    renderBudget.recordRow();

    const descText = item.description || (item.dynamic_fields ? item.dynamic_fields['description'] : '');
    const rawLines = String(descText).split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, descWidth, fontRegular, 9));
    });
    
    const rowHeight = descLines.length * 15;
    const rowEndY = cursorY - rowHeight - 5;
    
    page.drawLine({ start: { x: 50, y: rowEndY }, end: { x: width - 50, y: rowEndY }, thickness: 0.5, color: borderGray });

    let ty = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 60, y: ty, size: 9, font: fontBold, color: textColor });
      
      if (i === 0) {
        otherFields.forEach((field: any, idx: number) => {
          const cx = startX + (idx * colSpacing) + (colSpacing / 2);
          
          let rawVal = (item as any)[field.key];
          if (rawVal === undefined && item.dynamic_fields) {
            rawVal = item.dynamic_fields[field.key];
          }

          const displayVal = DocumentFieldMapper.mapValue(rawVal, field);
          const cleanVal = displayVal.replace("MZN", "").replace("€", "").trim();

          drawCenteredText(page, cleanVal, cx, ty, 9, fontBold, textColor);
        });
      }
      ty -= 15;
    }
    
    cursorY = rowEndY - 15;
  }

  // Summary Box
  const sumX = width - 250;
  
  page.drawText("Subtotal:", { x: sumX, y: cursorY, size: 9, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.subtotal), { x: sumX + 90, y: cursorY, size: 9, font: fontBold, color: textColor });

  if (quotation.discount > 0) {
    cursorY -= 15;
    page.drawText("Desconto:", { x: sumX, y: cursorY, size: 9, font: fontBold, color: textColor });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: sumX + 90, y: cursorY, size: 9, font: fontBold, color: textColor });
  }

  cursorY -= 15;
  page.drawText("Total IVA:", { x: sumX, y: cursorY, size: 9, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.vat_total), { x: sumX + 90, y: cursorY, size: 9, font: fontBold, color: textColor });

  cursorY -= 10;
  
  // Total Box
  page.drawRectangle({ x: sumX - 10, y: cursorY - 30, width: 210, height: 35, color: textColor, opacity: 0.9 });
  
  cursorY -= 22;
  page.drawText("TOTAL FINAL", { x: sumX, y: cursorY, size: 10, font: fontBold, color: white });
  page.drawText(formatCurrency(quotation.grand_total), { x: sumX + 90, y: cursorY, size: 12, font: fontBold, color: white });

  cursorY -= 50;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, textColor);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, textColor);
  
  renderSignatures(page, width, height, stampImage, sigImage, fontRegular, quotation, params.qrImage);
}

// Helpers
function renderNotesAndTerms(page: PDFPage, cursorY: number, quotation: Quotation, fontRegular: PDFFont, fontBold: PDFFont, textColor: any) {
  if (quotation.notes) {
    page.drawText("Notas:", { x: 50, y: cursorY, size: 10, font: fontBold, color: textColor });
    cursorY -= 15;
    const lines = quotation.notes.split("\n");
    for (const line of lines) {
      page.drawText(line, { x: 50, y: cursorY, size: 9, font: fontRegular, color: textColor });
      cursorY -= 12;
    }
    cursorY -= 10;
  }

  if (quotation.terms) {
    page.drawText("Termos e Condições:", { x: 50, y: cursorY, size: 10, font: fontBold, color: textColor });
    cursorY -= 15;
    const lines = quotation.terms.split("\n");
    for (const line of lines) {
      page.drawText(line, { x: 50, y: cursorY, size: 9, font: fontRegular, color: textColor });
      cursorY -= 12;
    }
  }
  return cursorY;
}

function renderFinancialInfo(page: PDFPage, cursorY: number, company: Company, fontRegular: PDFFont, fontBold: PDFFont, textColor: any) {
  const hasFinancial = company.bank_name || company.account_number || company.nib_iban || company.mpesa || company.emola;
  if (!hasFinancial) return cursorY;

  cursorY -= 15;
  page.drawText("Dados para Pagamento:", { x: 50, y: cursorY, size: 10, font: fontBold, color: textColor });
  cursorY -= 15;

  if (company.bank_name || company.account_number || company.nib_iban) {
    let bankInfo = `Banco: ${company.bank_name || "N/A"} | Conta: ${company.account_number || "N/A"}`;
    if (company.nib_iban) bankInfo += ` | NIB/IBAN: ${company.nib_iban}`;
    if (company.account_holder) bankInfo += ` | Titular: ${company.account_holder}`;
    page.drawText(bankInfo, { x: 50, y: cursorY, size: 9, font: fontRegular, color: textColor });
    cursorY -= 12;
  }
  
  if (company.mpesa || company.emola) {
    let mobileInfo = [];
    if (company.mpesa) mobileInfo.push(`M-Pesa: ${company.mpesa}`);
    if (company.emola) mobileInfo.push(`e-Mola: ${company.emola}`);
    page.drawText(mobileInfo.join(" | "), { x: 50, y: cursorY, size: 9, font: fontRegular, color: textColor });
    cursorY -= 12;
  }
  
  return cursorY;
}

function renderSignatures(page: PDFPage, width: number, height: number, stampImage: any, sigImage: any, fontRegular: PDFFont, quotation: Quotation, qrImage?: any) {
  const bottomY = 80;
  
  // Render QR Code on the left side
  if (qrImage) {
    page.drawImage(qrImage, {
      x: 50,
      y: bottomY,
      width: 50,
      height: 50,
    });
  }

  // Determinism Signatures removed per request

  if (stampImage) {
    const sDims = stampImage.scale(0.5);
    const scaleFactor = Math.min(80 / sDims.width, 80 / sDims.height, 1);
    page.drawImage(stampImage, {
      x: width - 250,
      y: bottomY,
      width: sDims.width * scaleFactor,
      height: sDims.height * scaleFactor,
      opacity: 0.8,
    });
  }

  if (sigImage) {
    const sigDims = sigImage.scale(0.5);
    const sigScale = Math.min(100 / sigDims.width, 50 / sigDims.height, 1);
    page.drawImage(sigImage, {
      x: width - 150,
      y: bottomY + 10,
      width: sigDims.width * sigScale,
      height: sigDims.height * sigScale,
    });
  }
}
// ==========================================
// CORPORATE TEMPLATE
// ==========================================
async function renderCorporateTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage, schema } = params;
  const { company, client, quotation, items } = data;

  const darkSlate = rgb(15/255, 23/255, 42/255); // slate-900
  const lightText = rgb(100/255, 116/255, 139/255); // slate-500
  const slate300 = rgb(203/255, 213/255, 225/255); // slate-300
  const slate100 = rgb(241/255, 245/255, 249/255); // slate-100
  const slate50 = rgb(248/255, 250/255, 252/255); // slate-50
  const textWhite = rgb(1, 1, 1);

  // 1. Solid Dark Slate Header Banner (Full width bleed at the top, extremely institutional)
  const headerHeight = 130;
  const headerY = height - headerHeight;
  page.drawRectangle({
    x: 0,
    y: headerY,
    width: width,
    height: headerHeight,
    color: darkSlate,
  });

  // Vertical position trackers inside the header
  let leftY = height - 40;
  let rightY = height - 40;

  // Header Left: Logo / Company Info
  if (logoImage) {
    const dims = logoImage.scale(0.5);
    const scaleFactor = Math.min(150 / dims.width, 40 / dims.height, 1);
    page.drawImage(logoImage, {
      x: 50,
      y: leftY - (dims.height * scaleFactor) + 5,
      width: dims.width * scaleFactor,
      height: dims.height * scaleFactor,
    });
    leftY -= (dims.height * scaleFactor) + 10;
  } else {
    page.drawText(company.name.toUpperCase(), {
      x: 50, y: leftY, size: 16, font: fontBold, color: textWhite,
    });
    leftY -= 14;
  }

  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 50, y: leftY, size: 8, font: fontBold, color: textWhite });
    leftY -= 10;
  }

  const contactParts = [];
  if (company.address) {
    contactParts.push(company.address.replace(/\n/g, ", "));
  }
  const phoneEmail = [company.phone, company.email].filter(Boolean).join("  •  ");
  if (phoneEmail) {
    contactParts.push(phoneEmail);
  }

  const contactText = contactParts.join("  |  ");
  const wrappedContact = wrapText(contactText, 300, fontRegular, 7.5);
  wrappedContact.forEach((line: string) => {
    page.drawText(line, { x: 50, y: leftY, size: 7.5, font: fontRegular, color: slate300 });
    leftY -= 9;
  });

  // Header Right: Proforma Title & Metadata
  page.drawText("PROFORMA", { x: width - 190, y: rightY, size: 22, font: fontBold, color: textWhite });
  rightY -= 18;

  page.drawText(`Ref. ${quotation.quotation_number}`, { x: width - 190, y: rightY, size: 9, font: fontBold, color: textWhite });
  rightY -= 12;
  page.drawText(`Emitido em: ${formatDate(quotation.date)}`, { x: width - 190, y: rightY, size: 8, font: fontRegular, color: slate300 });
  rightY -= 10;
  page.drawText(`Válido até: ${formatDate(quotation.expiry_date)}`, { x: width - 190, y: rightY, size: 8, font: fontRegular, color: slate300 });

  let cursorY = headerY - 28;

  // Corporate Client Box: Left accent border (Thick Slate line, no background color)
  const borderHeight = 55;
  page.drawRectangle({
    x: 40,
    y: cursorY - borderHeight,
    width: 3.5,
    height: borderHeight,
    color: darkSlate,
  });
  
  let clientY = cursorY - 8;
  page.drawText("FATURAR A", { x: 55, y: clientY, size: 7.5, font: fontBold, color: lightText });
  clientY -= 14;
  page.drawText(client.name, { x: 55, y: clientY, size: 10.5, font: fontBold, color: darkSlate });
  if (client.tax_number) {
    clientY -= 11;
    page.drawText(`NUIT: ${client.tax_number}`, { x: 55, y: clientY, size: 8, font: fontRegular, color: lightText });
  }
  if (client.address) {
    clientY -= 11;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), width - 100, fontRegular, 8);
    if (wrapped.length > 0) {
      page.drawText(wrapped[0], { x: 55, y: clientY, size: 8, font: fontRegular, color: lightText });
    }
  }

  cursorY -= borderHeight + 28;

  // Corporate Table Header (Clean solid horizontal lines, extremely elegant)
  const tblHeaderHeight = 25;
  page.drawRectangle({ x: 40, y: cursorY - 10, width: width - 80, height: tblHeaderHeight, color: darkSlate });
  
  const tblTextY = cursorY - 3;
  
  const itemFields = schema.itemFields;
  const descField = itemFields.find((f: any) => f.key === 'description');
  const otherFields = itemFields.filter((f: any) => f.key !== 'description');

  const descWidth = 250;
  const startX = 45 + descWidth + 20; 
  const availableWidth = (width - 40) - startX;
  const colSpacing = availableWidth / otherFields.length;

  if (descField) {
    page.drawText(descField.label, { x: 45, y: tblTextY, size: 9, font: fontBold, color: textWhite });
  }

  otherFields.forEach((field: any, idx: number) => {
    const cx = startX + (idx * colSpacing) + (colSpacing / 2);
    drawCenteredText(page, field.label, cx, tblTextY, 9, fontBold, textWhite);
  });

  cursorY -= 25;

  // Table Rows (with clean horizontal borders only, no vertical separators)
  const renderBudget = new DocumentRenderBudget(otherFields.length + 1);

  for (const item of items) {
    renderBudget.recordRow();

    const descText = item.description || (item.dynamic_fields ? item.dynamic_fields['description'] : '');
    const rawLines = String(descText).split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, descWidth, fontRegular, 9));
    });
    
    const rowHeight = descLines.length * 15 + 10;
    const rowStartY = cursorY + 15;
    const rowEndY = rowStartY - rowHeight;
    
    // Draw row bottom border
    page.drawLine({ start: { x: 40, y: rowEndY }, end: { x: width - 40, y: rowEndY }, thickness: 0.5, color: slate300 });

    let textY = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 45, y: textY, size: 9, font: fontRegular, color: darkSlate });
      
      if (i === 0) {
        otherFields.forEach((field: any, idx: number) => {
          const cx = startX + (idx * colSpacing) + (colSpacing / 2);
          
          let rawVal = (item as any)[field.key];
          if (rawVal === undefined && item.dynamic_fields) {
            rawVal = item.dynamic_fields[field.key];
          }

          const displayVal = DocumentFieldMapper.mapValue(rawVal, field);
          const cleanVal = displayVal.replace("MZN", "").replace("€", "").trim();

          drawCenteredText(page, cleanVal, cx, textY, 9, fontRegular, darkSlate);
        });
      }
      textY -= 15;
    }
    
    cursorY = rowEndY - 15;
  }

  cursorY -= 10;

  // Summary Totals (Clean list style)
  const sumX = width - 240;
  let sumY = cursorY;

  page.drawText("Subtotal:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkSlate });
  page.drawText(formatCurrency(quotation.subtotal), { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: darkSlate });

  if (quotation.discount > 0) {
    sumY -= 15;
    page.drawText("Desconto:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkSlate });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
  }

  sumY -= 15;
  page.drawText("Total IVA:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkSlate });
  page.drawText(formatCurrency(quotation.vat_total), { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: darkSlate });

  sumY -= 20;
  page.drawLine({ start: { x: sumX, y: sumY + 12 }, end: { x: width - 40, y: sumY + 12 }, thickness: 1.25, color: darkSlate });

  page.drawText("TOTAL FINAL", { x: sumX, y: sumY, size: 10, font: fontBold, color: darkSlate });
  page.drawText(formatCurrency(quotation.grand_total), { x: sumX + 80, y: sumY, size: 11, font: fontBold, color: darkSlate });

  cursorY = sumY - 40;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, darkSlate);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, darkSlate);
  
  // Signatures
  renderSignatures(page, width, height, stampImage, sigImage, fontRegular, quotation, params.qrImage);
}
