import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { Company, Client, Quotation, QuotationItem } from "../types";
import { formatCurrency } from "../utils";
import type { ProposalSections, SectionVisibility } from "@/components/commercial/proposalTypes";
import { DEFAULT_VISIBILITY } from "@/components/commercial/proposalTypes";

export interface ProposalPDFData {
  company: Company;
  client: Client | null;
  quotation: Quotation;
  items: QuotationItem[];
  sections: ProposalSections;
  visibility?: SectionVisibility;
}

async function embedImage(pdfDoc: PDFDocument, base64Url: string | null | undefined) {
  if (!base64Url) return null;
  try {
    const isPng = base64Url.startsWith("data:image/png");
    const isJpeg = base64Url.startsWith("data:image/jpeg") || base64Url.startsWith("data:image/jpg");
    if (!isPng && !isJpeg) return null;
    const base64Data = base64Url.split(",")[1];
    const binaryString = atob(base64Data);
    const imageBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) imageBytes[i] = binaryString.charCodeAt(i);
    return isPng ? pdfDoc.embedPng(imageBytes) : pdfDoc.embedJpg(imageBytes);
  } catch {
    return null;
  }
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(""); continue; }
    const words = para.split(/\s+/);
    let current = words[0] || "";
    for (let i = 1; i < words.length; i++) {
      const next = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(next, fontSize) < maxWidth) current = next;
      else { lines.push(current); current = words[i]; }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .trim();
}

export async function generateProposalPDF(data: ProposalPDFData): Promise<Uint8Array> {
  const { company, client, quotation, items, sections } = data;
  const v = { ...DEFAULT_VISIBILITY, ...data.visibility };

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await embedImage(pdfDoc, company.logo_url);
  const sigImage = await embedImage(pdfDoc, company.signature_url);
  const stampImage = await embedImage(pdfDoc, company.stamp_url);

  const margin = 56;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;
  const textColor = rgb(0.2, 0.25, 0.33);
  const mutedColor = rgb(0.55, 0.58, 0.63);
  const accentColor = rgb(0.06, 0.46, 0.43);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawFooter = (p: PDFPage) => {
    const footerY = 36;
    p.drawLine({ start: { x: margin, y: footerY + 14 }, end: { x: pageWidth - margin, y: footerY + 14 }, thickness: 0.5, color: rgb(0.88, 0.9, 0.92) });
    const footerLines = company.footer_text?.trim()
      ? company.footer_text.split("\n").map(l => l.trim()).filter(Boolean)
      : [company.name, company.phone, company.email].filter(Boolean) as string[];
    let fy = footerY;
    for (const line of footerLines) {
      const w = fontRegular.widthOfTextAtSize(line, 7.5);
      p.drawText(line, { x: (pageWidth - w) / 2, y: fy, size: 7.5, font: fontRegular, color: mutedColor });
      fy -= 10;
    }
  };

  const newPage = () => {
    drawFooter(page);
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 40) newPage();
  };

  // Cover
  if (logoImage) {
    const lw = Math.min(logoImage.width, 180);
    const lh = (logoImage.height / logoImage.width) * lw;
    const scale = Math.min(1, 48 / lh);
    const dw = lw * scale;
    const dh = lh * scale;
    page.drawImage(logoImage, { x: (pageWidth - dw) / 2, y: y - dh, width: dw, height: dh });
    y -= dh + 48;
  } else if (company.name) {
    const w = fontBold.widthOfTextAtSize(company.name, 16);
    page.drawText(company.name, { x: (pageWidth - w) / 2, y, size: 16, font: fontBold, color: textColor });
    y -= 48;
  }

  const coverTitle = "PROPOSTA TÉCNICA";
  const tw = fontBold.widthOfTextAtSize(coverTitle, 22);
  page.drawText(coverTitle, { x: (pageWidth - tw) / 2, y, size: 22, font: fontBold, color: textColor });
  y -= 28;
  page.drawLine({ start: { x: pageWidth / 2 - 40, y }, end: { x: pageWidth / 2 + 40, y }, thickness: 1, color: accentColor });
  y -= 32;

  const clientName = client?.name || quotation.client_name || "";
  const meta = [
    clientName && `Cliente: ${clientName}`,
    `Referência: ${quotation.quotation_number}`,
    `Data: ${new Date().toLocaleDateString("pt-PT")}`,
    quotation.expiry_date && `Validade: ${new Date(quotation.expiry_date).toLocaleDateString("pt-PT")}`,
  ].filter(Boolean) as string[];

  for (const line of meta) {
    const w = fontRegular.widthOfTextAtSize(line, 10);
    page.drawText(line, { x: (pageWidth - w) / 2, y, size: 10, font: fontRegular, color: mutedColor });
    y -= 16;
  }

  newPage();

  const sectionDefs: Array<{ key: keyof SectionVisibility; title: string; content?: string }> = [
    { key: "executiveSummary", title: "1. Resumo Executivo", content: sections.executiveSummary },
    { key: "proposedSolution", title: "2. Solução Proposta", content: sections.proposedSolution },
    { key: "scope", title: "3. Escopo do Serviço", content: sections.scope },
    { key: "timeline", title: "4. Cronograma Estimado", content: sections.timeline },
    { key: "conditions", title: "5. Condições Gerais", content: sections.conditions },
  ];

  for (const sec of sectionDefs) {
    if (!v[sec.key] || !sec.content?.trim()) continue;
    newPage();
    page.drawText(sec.title, { x: margin, y, size: 14, font: fontBold, color: textColor });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1.5, color: accentColor });
    y -= 20;

    const body = stripMarkdown(sec.content);
    const lines = wrapText(body, contentWidth, fontRegular, 10);
    for (const line of lines) {
      ensureSpace(14);
      if (line === "") { y -= 8; continue; }
      page.drawText(line, { x: margin, y, size: 10, font: fontRegular, color: textColor, maxWidth: contentWidth });
      y -= 14;
    }
  }

  if (v.financialTable && items.length > 0) {
    newPage();
    page.drawText("Investimento", { x: margin, y, size: 14, font: fontBold, color: textColor });
    y -= 24;
    for (const item of items) {
      ensureSpace(16);
      const desc = item.description.length > 60 ? item.description.slice(0, 57) + "..." : item.description;
      page.drawText(`${item.quantity}x ${desc}`, { x: margin, y, size: 9.5, font: fontRegular, color: textColor });
      const val = formatCurrency(item.total);
      const vw = fontRegular.widthOfTextAtSize(val, 9.5);
      page.drawText(val, { x: pageWidth - margin - vw, y, size: 9.5, font: fontRegular, color: textColor });
      y -= 16;
    }
    y -= 8;
    const totalLabel = "Total:";
    const totalVal = formatCurrency(quotation.grand_total);
    page.drawText(totalLabel, { x: pageWidth - margin - 120, y, size: 11, font: fontBold, color: textColor });
    page.drawText(totalVal, { x: pageWidth - margin - fontBold.widthOfTextAtSize(totalVal, 11), y, size: 11, font: fontBold, color: textColor });
  }

  if (v.signatures) {
    newPage();
    page.drawText("Aceitação", { x: margin, y, size: 14, font: fontBold, color: textColor });
    y -= 40;
    const sigY = y - 40;
    if (sigImage) page.drawImage(sigImage, { x: margin, y: sigY, width: 80, height: 32 });
    if (stampImage) page.drawImage(stampImage, { x: margin + 90, y: sigY, width: 48, height: 48 });
    page.drawLine({ start: { x: margin, y: sigY - 8 }, end: { x: margin + 180, y: sigY - 8 }, thickness: 0.5, color: mutedColor });
    page.drawText(company.name, { x: margin, y: sigY - 22, size: 9, font: fontBold, color: textColor });
    if (clientName) {
      page.drawLine({ start: { x: pageWidth - margin - 180, y: sigY - 8 }, end: { x: pageWidth - margin, y: sigY - 8 }, thickness: 0.5, color: mutedColor });
      page.drawText(clientName, { x: pageWidth - margin - 180, y: sigY - 22, size: 9, font: fontBold, color: textColor });
    }
  }

  drawFooter(page);
  return pdfDoc.save();
}
