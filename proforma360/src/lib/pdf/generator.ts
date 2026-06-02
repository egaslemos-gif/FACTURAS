import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { Company, Client, Quotation, QuotationItem } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface PDFData {
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
  
  if (template === 'modern') {
    await renderModernTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage });
  } else if (template === 'corporate') {
    await renderCorporateTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage });
  } else {
    await renderMinimalTemplate({ page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage });
  }

  // Footer text for all templates
  if (company.footer_text) {
    page.drawText(company.footer_text, {
      x: 50,
      y: 30,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await pdfDoc.save();
}

// ==========================================
// MINIMAL TEMPLATE
// ==========================================
async function renderMinimalTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage } = params;
  const { company, client, quotation, items } = data;

  const primaryColor = rgb(0.1, 0.35, 0.7);
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const lineGray = rgb(0.8, 0.8, 0.8);

  let cursorY = height - 50;

  // Header: Company Logo & Info
  if (logoImage) {
    const dims = logoImage.scale(0.5); // Adjust scale as needed
    // Limit max height/width
    const scaleFactor = Math.min(150 / dims.width, 60 / dims.height, 1);
    page.drawImage(logoImage, {
      x: 50,
      y: cursorY - (dims.height * scaleFactor) + 20,
      width: dims.width * scaleFactor,
      height: dims.height * scaleFactor,
    });
    cursorY -= (dims.height * scaleFactor);
  } else {
    page.drawText(company.name.toUpperCase(), {
      x: 50, y: cursorY, size: 24, font: fontBold, color: primaryColor,
    });
    cursorY -= 20;
  }
  
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
    cursorY -= 15;
  }
  
  if (company.address) {
    const lines = company.address.split("\n");
    lines.forEach((line: string) => {
      const wrapped = wrapText(line, 250, fontRegular, 10);
      wrapped.forEach((wLine: string) => {
        page.drawText(wLine, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
        cursorY -= 15;
      });
    });
  }

  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join(" | ");
    page.drawText(contact, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
  }

  // Header: Proforma Info
  let rightCursorY = height - 50;
  
  page.drawText("PROFORMA", { x: width - 200, y: rightCursorY, size: 24, font: fontBold, color: textColor });
  rightCursorY -= 25;
  page.drawText(`Nº: ${quotation.quotation_number}`, { x: width - 200, y: rightCursorY, size: 12, font: fontBold, color: textColor });
  rightCursorY -= 20;
  page.drawText(`Data: ${formatDate(quotation.date)}`, { x: width - 200, y: rightCursorY, size: 10, font: fontRegular, color: textColor });
  rightCursorY -= 15;
  page.drawText(`Validade: ${formatDate(quotation.expiry_date)}`, { x: width - 200, y: rightCursorY, size: 10, font: fontRegular, color: textColor });

  cursorY = Math.min(cursorY, rightCursorY) - 40;

  // Client Info Box
  page.drawRectangle({ x: 50, y: cursorY - 75, width: width - 100, height: 90, color: lightGray });

  cursorY -= 10;
  page.drawText("Faturar a:", { x: 60, y: cursorY, size: 10, font: fontBold, color: textColor });
  cursorY -= 15;
  page.drawText(client.name, { x: 60, y: cursorY, size: 12, font: fontBold, color: textColor });

  if (client.tax_number) {
    cursorY -= 15;
    page.drawText(`NUIT: ${client.tax_number}`, { x: 60, y: cursorY, size: 10, font: fontRegular, color: textColor });
  }
  if (client.address) {
    cursorY -= 15;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), 250, fontRegular, 10);
    wrapped.forEach((line: string) => {
      page.drawText(line, { x: 60, y: cursorY, size: 10, font: fontRegular, color: textColor });
      cursorY -= 15;
    });
    cursorY += 15; // compensate last sub
  }

  cursorY -= 40;

  // Table Header
  const tableTop = cursorY;
  page.drawLine({ start: { x: 50, y: tableTop }, end: { x: width - 50, y: tableTop }, thickness: 1, color: primaryColor });

  cursorY -= 15;
  page.drawText("Descrição", { x: 55, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Qtd", { x: 300, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Preço", { x: 350, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("IVA", { x: 420, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Total", { x: 480, y: cursorY, size: 10, font: fontBold, color: textColor });

  cursorY -= 10;
  page.drawLine({ start: { x: 50, y: cursorY }, end: { x: width - 50, y: cursorY }, thickness: 1, color: primaryColor });

  cursorY -= 20;

  // Table Rows
  for (const item of items) {
    const rawLines = item.description.split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, 230, fontRegular, 9));
    });

    const rowHeight = descLines.length * 15 + 10;
    const rowStartY = cursorY + 10;
    const rowEndY = rowStartY - rowHeight;

    let textY = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 55, y: textY, size: 9, font: fontRegular, color: textColor });
      
      if (i === 0) {
        page.drawText(item.quantity.toString(), { x: 300, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.unit_price).replace("MZN", "").trim(), { x: 350, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(`${item.vat_rate}%`, { x: 420, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.total).replace("MZN", "").trim(), { x: 480, y: textY, size: 9, font: fontRegular, color: textColor });
      }
      textY -= 15;
    }
    cursorY = rowEndY - 10;
  }

  page.drawLine({ start: { x: 50, y: cursorY + 10 }, end: { x: width - 50, y: cursorY + 10 }, thickness: 1, color: lineGray });

  cursorY -= 15;

  // Summary Totals
  const summaryX = 350;
  page.drawText("Subtotal:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.subtotal), { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: textColor });

  if (quotation.discount > 0) {
    cursorY -= 15;
    page.drawText("Desconto:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
  }

  cursorY -= 15;
  page.drawText("Total IVA:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.vat_total), { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: textColor });

  cursorY -= 20;
  page.drawText("Total Final:", { x: summaryX, y: cursorY, size: 12, font: fontBold, color: primaryColor });
  page.drawText(formatCurrency(quotation.grand_total), { x: summaryX + 80, y: cursorY, size: 12, font: fontBold, color: primaryColor });

  cursorY -= 40;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, textColor);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, textColor);
  
  // Signatures
  renderSignatures(page, width, height, stampImage, sigImage);
}

// ==========================================
// MODERN TEMPLATE
// ==========================================
async function renderModernTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage } = params;
  const { company, client, quotation, items } = data;

  const primaryColor = rgb(0.0, 0.24, 0.66); // Darker blue
  const secondaryColor = rgb(0.95, 0.96, 0.98); // Very light blue/gray
  const textColor = rgb(0.15, 0.15, 0.15);
  const lightText = rgb(0.4, 0.4, 0.4);

  let logoHeight = 15;
  let logoDims = { width: 0, height: 0 };
  let logoScale = 1;
  
  if (logoImage) {
    logoDims = logoImage.scale(0.5);
    logoScale = Math.min(150 / logoDims.width, 60 / logoDims.height, 1);
    logoHeight = logoDims.height * logoScale;
  }

  let calculatedHeaderHeight = 40 + logoHeight + 5;
  if (company.tax_number) calculatedHeaderHeight += 12;
  if (company.address) {
    const addressLines = company.address.split("\n").map((l: string) => wrapText(l, 250, fontRegular, 9)).flat().length;
    calculatedHeaderHeight += addressLines * 12;
  }
  if (company.email || company.phone) calculatedHeaderHeight += 12;
  calculatedHeaderHeight += 20; // bottom padding

  const headerHeight = Math.max(120, calculatedHeaderHeight);
  
  page.drawRectangle({ x: 0, y: height - headerHeight, width: width, height: headerHeight, color: primaryColor });

  let cursorY = height - 40;

  // Header: Company Logo & Info (White text)
  if (logoImage) {
    page.drawImage(logoImage, {
      x: 40, y: cursorY - logoHeight + 15, width: logoDims.width * logoScale, height: logoHeight,
    });
    cursorY -= logoHeight;
  } else {
    page.drawText(company.name.toUpperCase(), { x: 40, y: cursorY, size: 22, font: fontBold, color: rgb(1,1,1) });
    cursorY -= 15;
  }
  
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 40, y: cursorY, size: 9, font: fontRegular, color: rgb(1,1,1) });
    cursorY -= 12;
  }
  if (company.address) {
    const lines = company.address.split("\n");
    lines.forEach((line: string) => {
      const wrapped = wrapText(line, 250, fontRegular, 9);
      wrapped.forEach((wLine: string) => {
        page.drawText(wLine, { x: 40, y: cursorY, size: 9, font: fontRegular, color: rgb(1,1,1) });
        cursorY -= 12;
      });
    });
  }
  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join(" | ");
    page.drawText(contact, { x: 40, y: cursorY, size: 9, font: fontRegular, color: rgb(1,1,1) });
  }

  // Header: Proforma Info
  let rightCursorY = height - 40;
  page.drawText("PROFORMA", { x: width - 200, y: rightCursorY, size: 28, font: fontBold, color: rgb(1,1,1) });
  rightCursorY -= 25;
  page.drawText(`Nº: ${quotation.quotation_number}`, { x: width - 200, y: rightCursorY, size: 12, font: fontBold, color: rgb(1,1,1) });
  rightCursorY -= 15;
  page.drawText(`Data: ${formatDate(quotation.date)}`, { x: width - 200, y: rightCursorY, size: 10, font: fontRegular, color: rgb(1,1,1) });

  cursorY = height - 150;

  // Modern Client Box
  page.drawRectangle({ x: 40, y: cursorY - 80, width: width / 2 - 50, height: 80, color: secondaryColor });
  
  let leftY = cursorY - 15;
  page.drawText("Faturar a:", { x: 50, y: leftY, size: 9, font: fontRegular, color: lightText });
  leftY -= 15;
  page.drawText(client.name, { x: 50, y: leftY, size: 12, font: fontBold, color: primaryColor });
  if (client.tax_number) {
    leftY -= 15;
    page.drawText(`NUIT: ${client.tax_number}`, { x: 50, y: leftY, size: 10, font: fontRegular, color: textColor });
  }
  if (client.address) {
    leftY -= 15;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), 200, fontRegular, 10);
    wrapped.forEach((line: string) => {
      page.drawText(line, { x: 50, y: leftY, size: 10, font: fontRegular, color: textColor });
      leftY -= 15;
    });
  }

  // Info Box
  page.drawRectangle({ x: width / 2 + 10, y: cursorY - 80, width: width / 2 - 50, height: 80, color: secondaryColor });
  let rightY = cursorY - 15;
  page.drawText("Detalhes:", { x: width / 2 + 20, y: rightY, size: 9, font: fontRegular, color: lightText });
  rightY -= 15;
  page.drawText(`Validade: ${formatDate(quotation.expiry_date)}`, { x: width / 2 + 20, y: rightY, size: 10, font: fontRegular, color: textColor });
  
  cursorY -= 110;

  // Modern Table Header (Filled Box)
  page.drawRectangle({ x: 40, y: cursorY - 5, width: width - 80, height: 25, color: primaryColor });
  
  const textY = cursorY + 2;
  page.drawText("Descrição", { x: 50, y: textY, size: 10, font: fontBold, color: rgb(1,1,1) });
  page.drawText("Qtd", { x: 320, y: textY, size: 10, font: fontBold, color: rgb(1,1,1) });
  page.drawText("Preço", { x: 370, y: textY, size: 10, font: fontBold, color: rgb(1,1,1) });
  page.drawText("IVA", { x: 440, y: textY, size: 10, font: fontBold, color: rgb(1,1,1) });
  page.drawText("Total", { x: 490, y: textY, size: 10, font: fontBold, color: rgb(1,1,1) });

  cursorY -= 20;

  // Table Rows (Alternating colors)
  let rowIndex = 0;
  for (const item of items) {
    const rawLines = item.description.split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, 250, fontRegular, 9));
    });
    
    const rowHeight = descLines.length * 15 + 10;
    const rowStartY = cursorY + 10;
    const rowEndY = rowStartY - rowHeight;
    
    if (rowIndex % 2 !== 0) {
      page.drawRectangle({ x: 40, y: rowEndY, width: width - 80, height: rowHeight, color: secondaryColor });
    }

    let textY = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 50, y: textY, size: 9, font: fontRegular, color: textColor });
      
      if (i === 0) {
        page.drawText(item.quantity.toString(), { x: 320, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.unit_price).replace("MZN", "").trim(), { x: 370, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(`${item.vat_rate}%`, { x: 440, y: textY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.total).replace("MZN", "").trim(), { x: 490, y: textY, size: 9, font: fontRegular, color: textColor });
      }
      textY -= 15;
    }
    
    cursorY = rowEndY - 10;
    rowIndex++;
  }

  cursorY -= 10;

  // Summary Totals in a Right-aligned Box
  const summaryBoxY = cursorY - 70;
  page.drawRectangle({ x: width - 240, y: summaryBoxY, width: 200, height: 80, color: secondaryColor });
  
  let sumY = cursorY - 10;
  const sumX = width - 220;
  
  page.drawText("Subtotal:", { x: sumX, y: sumY, size: 10, font: fontRegular, color: textColor });
  page.drawText(formatCurrency(quotation.subtotal), { x: sumX + 80, y: sumY, size: 10, font: fontRegular, color: textColor });

  if (quotation.discount > 0) {
    sumY -= 15;
    page.drawText("Desconto:", { x: sumX, y: sumY, size: 10, font: fontRegular, color: textColor });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: sumX + 80, y: sumY, size: 10, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
  }

  sumY -= 15;
  page.drawText("Total IVA:", { x: sumX, y: sumY, size: 10, font: fontRegular, color: textColor });
  page.drawText(formatCurrency(quotation.vat_total), { x: sumX + 80, y: sumY, size: 10, font: fontRegular, color: textColor });

  sumY -= 20;
  page.drawText("Total Final:", { x: sumX, y: sumY, size: 12, font: fontBold, color: primaryColor });
  page.drawText(formatCurrency(quotation.grand_total), { x: sumX + 80, y: sumY, size: 12, font: fontBold, color: primaryColor });

  cursorY -= 90;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, textColor);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, textColor);
  
  // Signatures
  renderSignatures(page, width, height, stampImage, sigImage);
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

function renderSignatures(page: PDFPage, width: number, height: number, stampImage: any, sigImage: any) {
  const bottomY = 80;
  
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
    const sDims = sigImage.scale(0.5);
    const scaleFactor = Math.min(100 / sDims.width, 60 / sDims.height, 1);
    page.drawImage(sigImage, {
      x: width - 150,
      y: bottomY + 10,
      width: sDims.width * scaleFactor,
      height: sDims.height * scaleFactor,
    });
  }
}

// ==========================================
// CORPORATE TEMPLATE
// ==========================================
async function renderCorporateTemplate(params: any) {
  const { page, width, height, fontRegular, fontBold, data, logoImage, stampImage, sigImage } = params;
  const { company, client, quotation, items } = data;

  const darkGray = rgb(0.2, 0.2, 0.2);
  const midGray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const borderColor = rgb(0.7, 0.7, 0.7);

  let cursorY = height - 40;

  // Header Left: Logo & Company Info
  if (logoImage) {
    const dims = logoImage.scale(0.5);
    const scaleFactor = Math.min(150 / dims.width, 60 / dims.height, 1);
    page.drawImage(logoImage, {
      x: 40, y: cursorY - (dims.height * scaleFactor) + 15, width: dims.width * scaleFactor, height: dims.height * scaleFactor,
    });
    cursorY -= (dims.height * scaleFactor) + 10;
  } else {
    page.drawText(company.name.toUpperCase(), { x: 40, y: cursorY, size: 20, font: fontBold, color: darkGray });
    cursorY -= 20;
  }
  
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 40, y: cursorY, size: 9, font: fontRegular, color: midGray });
    cursorY -= 12;
  }
  if (company.address) {
    const lines = company.address.split("\n");
    lines.forEach((line: string) => {
      const wrapped = wrapText(line, 250, fontRegular, 9);
      wrapped.forEach((wLine: string) => {
        page.drawText(wLine, { x: 40, y: cursorY, size: 9, font: fontRegular, color: midGray });
        cursorY -= 12;
      });
    });
  }
  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join(" | ");
    page.drawText(contact, { x: 40, y: cursorY, size: 9, font: fontRegular, color: midGray });
  }

  // Header Right: Proforma Info
  let rightCursorY = height - 40;
  page.drawText("PROFORMA", { x: width - 200, y: rightCursorY, size: 24, font: fontBold, color: darkGray });
  
  // Right Box for Proforma details
  page.drawRectangle({ x: width - 200, y: rightCursorY - 60, width: 160, height: 50, borderColor: borderColor, borderWidth: 1, color: lightGray });
  
  rightCursorY -= 25;
  page.drawText(`Nº Doc:`, { x: width - 190, y: rightCursorY, size: 9, font: fontBold, color: darkGray });
  page.drawText(quotation.quotation_number, { x: width - 110, y: rightCursorY, size: 9, font: fontRegular, color: darkGray });
  
  rightCursorY -= 15;
  page.drawText(`Data:`, { x: width - 190, y: rightCursorY, size: 9, font: fontBold, color: darkGray });
  page.drawText(formatDate(quotation.date), { x: width - 110, y: rightCursorY, size: 9, font: fontRegular, color: darkGray });
  
  rightCursorY -= 15;
  page.drawText(`Validade:`, { x: width - 190, y: rightCursorY, size: 9, font: fontBold, color: darkGray });
  page.drawText(formatDate(quotation.expiry_date), { x: width - 110, y: rightCursorY, size: 9, font: fontRegular, color: darkGray });

  cursorY = Math.min(cursorY, rightCursorY - 20) - 20;

  // Client Info Area
  page.drawText("FATURAR A:", { x: 40, y: cursorY, size: 10, font: fontBold, color: darkGray });
  cursorY -= 5;
  page.drawLine({ start: { x: 40, y: cursorY }, end: { x: 300, y: cursorY }, thickness: 1, color: borderColor });
  cursorY -= 15;
  
  page.drawText(client.name, { x: 40, y: cursorY, size: 11, font: fontBold, color: darkGray });
  if (client.tax_number) {
    cursorY -= 15;
    page.drawText(`NUIT: ${client.tax_number}`, { x: 40, y: cursorY, size: 10, font: fontRegular, color: darkGray });
  }
  if (client.address) {
    cursorY -= 15;
    const wrapped = wrapText(client.address.replace(/\n/g, ", "), 250, fontRegular, 10);
    wrapped.forEach((line: string) => {
      page.drawText(line, { x: 40, y: cursorY, size: 10, font: fontRegular, color: darkGray });
      cursorY -= 15;
    });
    cursorY += 15;
  }

  cursorY -= 40;

  // Corporate Table Header
  page.drawRectangle({ x: 40, y: cursorY - 5, width: width - 80, height: 20, borderColor: borderColor, borderWidth: 1, color: lightGray });
  
  const textY = cursorY;
  page.drawText("Descrição", { x: 50, y: textY, size: 9, font: fontBold, color: darkGray });
  page.drawText("Qtd", { x: 320, y: textY, size: 9, font: fontBold, color: darkGray });
  page.drawText("Preço", { x: 370, y: textY, size: 9, font: fontBold, color: darkGray });
  page.drawText("IVA", { x: 440, y: textY, size: 9, font: fontBold, color: darkGray });
  page.drawText("Total", { x: 490, y: textY, size: 9, font: fontBold, color: darkGray });

  cursorY -= 20;

  // Table Rows (with borders)
  for (const item of items) {
    const rawLines = item.description.split("\n");
    let descLines: string[] = [];
    rawLines.forEach((l: string) => {
      descLines = descLines.concat(wrapText(l, 250, fontRegular, 9));
    });
    
    const rowHeight = descLines.length * 15 + 10;
    const rowStartY = cursorY + 15; // Top of the row border is 15px above the text baseline
    const rowEndY = rowStartY - rowHeight; // Bottom of the row border
    
    // Draw row bottom border
    page.drawLine({ start: { x: 40, y: rowEndY }, end: { x: width - 40, y: rowEndY }, thickness: 0.5, color: borderColor });

    // Draw vertical separators
    page.drawLine({ start: { x: 40, y: rowStartY }, end: { x: 40, y: rowEndY }, thickness: 1, color: borderColor });
    page.drawLine({ start: { x: 310, y: rowStartY }, end: { x: 310, y: rowEndY }, thickness: 0.5, color: borderColor });
    page.drawLine({ start: { x: 360, y: rowStartY }, end: { x: 360, y: rowEndY }, thickness: 0.5, color: borderColor });
    page.drawLine({ start: { x: 430, y: rowStartY }, end: { x: 430, y: rowEndY }, thickness: 0.5, color: borderColor });
    page.drawLine({ start: { x: 480, y: rowStartY }, end: { x: 480, y: rowEndY }, thickness: 0.5, color: borderColor });
    page.drawLine({ start: { x: width - 40, y: rowStartY }, end: { x: width - 40, y: rowEndY }, thickness: 1, color: borderColor });

    let textY = cursorY;
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 45, y: textY, size: 9, font: fontRegular, color: darkGray });
      
      if (i === 0) {
        page.drawText(item.quantity.toString(), { x: 315, y: textY, size: 9, font: fontRegular, color: darkGray });
        page.drawText(formatCurrency(item.unit_price).replace("MZN", "").trim(), { x: 365, y: textY, size: 9, font: fontRegular, color: darkGray });
        page.drawText(`${item.vat_rate}%`, { x: 435, y: textY, size: 9, font: fontRegular, color: darkGray });
        page.drawText(formatCurrency(item.total).replace("MZN", "").trim(), { x: 485, y: textY, size: 9, font: fontRegular, color: darkGray });
      }
      textY -= 15;
    }
    
    // Set cursorY for the next row to be 15px below the previous row's bottom border
    // This perfectly aligns the next text baseline.
    cursorY = rowEndY - 15;
  }

  cursorY -= 20;

  // Summary Totals in a strict Box
  const summaryBoxY = cursorY - 70;
  page.drawRectangle({ x: width - 240, y: summaryBoxY, width: 200, height: 80, borderColor: borderColor, borderWidth: 1, color: lightGray });
  
  let sumY = cursorY - 10;
  const sumX = width - 220;
  
  page.drawText("Subtotal:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkGray });
  page.drawText(formatCurrency(quotation.subtotal), { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: darkGray });

  if (quotation.discount > 0) {
    sumY -= 15;
    page.drawText("Desconto:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkGray });
    const discVal = quotation.discount_type === "percentage" ? quotation.subtotal * (quotation.discount / 100) : quotation.discount;
    page.drawText(`-${formatCurrency(discVal)}`, { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: darkGray });
  }

  sumY -= 15;
  page.drawText("Total IVA:", { x: sumX, y: sumY, size: 9, font: fontRegular, color: darkGray });
  page.drawText(formatCurrency(quotation.vat_total), { x: sumX + 80, y: sumY, size: 9, font: fontRegular, color: darkGray });

  sumY -= 10;
  page.drawLine({ start: { x: sumX - 20, y: sumY }, end: { x: width - 40, y: sumY }, thickness: 1, color: borderColor });
  sumY -= 15;

  page.drawText("TOTAL FINAL:", { x: sumX, y: sumY, size: 10, font: fontBold, color: darkGray });
  page.drawText(formatCurrency(quotation.grand_total), { x: sumX + 80, y: sumY, size: 11, font: fontBold, color: darkGray });

  cursorY -= 100;
  cursorY = renderNotesAndTerms(page, cursorY, quotation, fontRegular, fontBold, darkGray);
  cursorY -= 10;
  cursorY = renderFinancialInfo(page, cursorY, company, fontRegular, fontBold, darkGray);
  
  // Signatures
  renderSignatures(page, width, height, stampImage, sigImage);
}
