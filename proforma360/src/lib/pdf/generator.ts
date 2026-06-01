import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Company, Client, Quotation, QuotationItem } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface PDFData {
  company: Company;
  client: Client;
  quotation: Quotation;
  items: QuotationItem[];
}

export async function generateQuotationPDF(data: PDFData): Promise<Uint8Array> {
  const { company, client, quotation, items } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();

  // Load fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.1, 0.35, 0.7); // Adjust based on primary brand color
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const lineGray = rgb(0.8, 0.8, 0.8);

  let cursorY = height - 50;

  // Header: Company Logo & Info
  // If we had a logo_url, we would fetch and embed it here.
  // For MVP, we'll draw the company name in bold.
  page.drawText(company.name.toUpperCase(), {
    x: 50,
    y: cursorY,
    size: 24,
    font: fontBold,
    color: primaryColor,
  });

  cursorY -= 20;
  
  if (company.tax_number) {
    page.drawText(`NUIT: ${company.tax_number}`, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
    cursorY -= 15;
  }
  
  if (company.address) {
    const addressLines = company.address.split("\n");
    addressLines.forEach(line => {
      page.drawText(line, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
      cursorY -= 15;
    });
  }

  if (company.email || company.phone) {
    const contact = [company.email, company.phone].filter(Boolean).join(" | ");
    page.drawText(contact, { x: 50, y: cursorY, size: 10, font: fontRegular, color: textColor });
  }

  // Header: Proforma Info
  let rightCursorY = height - 50;
  
  page.drawText("PROFORMA", {
    x: width - 200,
    y: rightCursorY,
    size: 24,
    font: fontBold,
    color: textColor,
  });
  
  rightCursorY -= 25;
  page.drawText(`Nº: ${quotation.quotation_number}`, { x: width - 200, y: rightCursorY, size: 12, font: fontBold, color: textColor });
  
  rightCursorY -= 20;
  page.drawText(`Data: ${formatDate(quotation.date)}`, { x: width - 200, y: rightCursorY, size: 10, font: fontRegular, color: textColor });
  
  rightCursorY -= 15;
  page.drawText(`Validade: ${formatDate(quotation.expiry_date)}`, { x: width - 200, y: rightCursorY, size: 10, font: fontRegular, color: textColor });

  cursorY = Math.min(cursorY, rightCursorY) - 40;

  // Client Info Box
  page.drawRectangle({
    x: 50,
    y: cursorY - 75,
    width: width - 100,
    height: 90,
    color: lightGray,
  });

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
    page.drawText(client.address.replace(/\n/g, ", "), { x: 60, y: cursorY, size: 10, font: fontRegular, color: textColor });
  }

  cursorY -= 40;

  // Table Header
  const tableTop = cursorY;
  page.drawLine({
    start: { x: 50, y: tableTop },
    end: { x: width - 50, y: tableTop },
    thickness: 1,
    color: primaryColor,
  });

  cursorY -= 15;
  page.drawText("Descrição", { x: 55, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Qtd", { x: 300, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Preço", { x: 350, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("IVA", { x: 420, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText("Total", { x: 480, y: cursorY, size: 10, font: fontBold, color: textColor });

  cursorY -= 10;
  page.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    thickness: 1,
    color: primaryColor,
  });

  cursorY -= 20;

  // Table Rows
  for (const item of items) {
    // Check if we need a new page
    if (cursorY < 200) {
      // Create new page logic here if necessary for MVP we assume it fits
    }

    // Split long descriptions
    const descLines = item.description.split("\n");
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: 55, y: cursorY, size: 9, font: fontRegular, color: textColor });
      
      if (i === 0) { // Only draw prices on the first line of the item
        page.drawText(item.quantity.toString(), { x: 300, y: cursorY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.unit_price).replace("MZN", "").trim(), { x: 350, y: cursorY, size: 9, font: fontRegular, color: textColor });
        page.drawText(`${item.vat_rate}%`, { x: 420, y: cursorY, size: 9, font: fontRegular, color: textColor });
        page.drawText(formatCurrency(item.total).replace("MZN", "").trim(), { x: 480, y: cursorY, size: 9, font: fontRegular, color: textColor });
      }
      
      cursorY -= 15;
    }
    cursorY -= 5; // Extra padding between items
  }

  page.drawLine({
    start: { x: 50, y: cursorY + 10 },
    end: { x: width - 50, y: cursorY + 10 },
    thickness: 1,
    color: lineGray,
  });

  cursorY -= 15;

  // Summary Totals
  const summaryX = 350;
  page.drawText("Subtotal:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.subtotal), { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: textColor });

  if (quotation.discount > 0) {
    cursorY -= 15;
    page.drawText("Desconto:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
    
    const discVal = quotation.discount_type === "percentage" 
      ? quotation.subtotal * (quotation.discount / 100) 
      : quotation.discount;
      
    page.drawText(`-${formatCurrency(discVal)}`, { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
  }

  cursorY -= 15;
  page.drawText("Total IVA:", { x: summaryX, y: cursorY, size: 10, font: fontBold, color: textColor });
  page.drawText(formatCurrency(quotation.vat_total), { x: summaryX + 80, y: cursorY, size: 10, font: fontRegular, color: textColor });

  cursorY -= 20;
  page.drawText("Total Final:", { x: summaryX, y: cursorY, size: 12, font: fontBold, color: primaryColor });
  page.drawText(formatCurrency(quotation.grand_total), { x: summaryX + 80, y: cursorY, size: 12, font: fontBold, color: primaryColor });

  // Notes & Terms
  cursorY -= 40;
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

  // Footer text
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
