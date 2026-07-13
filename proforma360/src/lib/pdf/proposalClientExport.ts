"use client";

import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PrintableProposal } from "@/components/commercial/PrintableProposal";
import { PrintableProposalMinimal } from "@/components/commercial/PrintableProposalMinimal";
import { PrintableProposalCorporate } from "@/components/commercial/PrintableProposalCorporate";
import type {
  ProposalTemplate,
  ProposalSections,
  SectionVisibility,
  PrintableProposalProps,
  CustomProposalSection,
} from "@/components/commercial/proposalTypes";
import { resolveVisibility } from "@/components/commercial/proposalTypes";
import type { Company, Client, Quotation, QuotationItem } from "@/lib/types";

export interface ProposalClientExportData {
  company: Company;
  client: Client | null;
  quotation: Quotation;
  items: QuotationItem[];
  sections: ProposalSections;
  customSections?: CustomProposalSection[];
  visibility?: SectionVisibility;
  template?: ProposalTemplate;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const HOST_ID = "proposal-pdf-export-host";

function waitForRender(ms = 600): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, ms);
    });
  });
}

function getTemplateComponent(template: ProposalTemplate) {
  if (template === "minimal") return PrintableProposalMinimal;
  if (template === "corporate") return PrintableProposalCorporate;
  return PrintableProposal;
}

function scopePrintCss(cssText: string): string {
  return cssText
    .replace(/^([^{@]+)/, (selectorBlock) =>
      selectorBlock
        .split(",")
        .map((sel) => {
          const s = sel.trim();
          if (!s || s.startsWith("@")) return s;
          if (s === "html" || s === "body" || s === "html, body") return `#${HOST_ID}`;
          if (s.includes(HOST_ID)) return s;
          return `#${HOST_ID} ${s}`;
        })
        .join(", ")
    )
    .replace(/position:\s*fixed/gi, "position: absolute");
}

function injectPrintStyles(host: HTMLElement): void {
  if (host.querySelector("#proposal-export-print-styles")) return;

  let cssText = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("print")) {
          for (const inner of Array.from(rule.cssRules)) {
            const raw = inner.cssText;
            if (
              raw.includes("body :has(.printable-proposal-root)") ||
              raw.includes(".print\\:hidden") ||
              raw.includes("[data-sonner-toaster]")
            ) {
              continue;
            }
            cssText += scopePrintCss(raw) + "\n";
          }
        }
      }
    } catch {
      // Stylesheet cross-origin ou inacessível
    }
  }

  const style = document.createElement("style");
  style.id = "proposal-export-print-styles";
  style.textContent = `
    #${HOST_ID} {
      width: ${A4_WIDTH_PX}px !important;
      background: #ffffff !important;
      color: #1e293b !important;
      overflow: visible !important;
    }
    #${HOST_ID} .printable-proposal-root {
      display: block !important;
      width: 100% !important;
      padding-bottom: 48px !important;
    }
    ${cssText}
  `;
  host.prepend(style);
}

/**
 * Gera PDF da proposta técnica com os mesmos componentes React + estilos de impressão.
 */
export async function generateProposalPDFFromTemplate(
  data: ProposalClientExportData
): Promise<Uint8Array> {
  const template = data.template || "executivo";
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-proposal-export", "true");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:794px;min-height:100px;background:#fff;z-index:-1;overflow:visible;pointer-events:none;";
  document.body.appendChild(host);

  let root: Root | null = null;

  try {
    injectPrintStyles(host);
    root = createRoot(host);

    const props: PrintableProposalProps = {
      company: data.company,
      client: data.client,
      quotation: data.quotation,
      items: data.items,
      sections: data.sections,
      customSections: data.customSections,
      visibility: resolveVisibility(data.visibility),
    };

    const Component = getTemplateComponent(template);
    root.render(createElement(Component, props));

    await waitForRender(900);
    if (document.fonts?.ready) await document.fonts.ready;

    const printable = host.querySelector(".printable-proposal-root") as HTMLElement | null;
    if (!printable) {
      throw new Error("Componente imprimível não encontrado para exportação.");
    }

    const totalHeight = printable.scrollHeight;
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4", compress: true });

    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < totalHeight) {
      const sliceHeight = Math.min(A4_HEIGHT_PX, totalHeight - yOffset);
      const canvas = await html2canvas(printable, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: sliceHeight,
        windowWidth: A4_WIDTH_PX,
        windowHeight: sliceHeight,
        y: yOffset,
        scrollY: -yOffset,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_PX, sliceHeight);
      yOffset += sliceHeight;
      pageIndex += 1;
    }

    const buffer = pdf.output("arraybuffer");
    return new Uint8Array(buffer);
  } finally {
    root?.unmount();
    host.remove();
  }
}
