import React from "react";
import ReactMarkdown from "react-markdown";
import { formatCurrency } from "@/lib/utils";
import { PrintableProposalProps, safeNumber } from "./proposalTypes";

function safeCurrency(val: unknown): string {
  return formatCurrency(safeNumber(val));
}

export function PrintableProposalMinimal({ company, client, quotation, items, sections }: PrintableProposalProps) {
  if (!quotation) return null;

  const date = new Date().toLocaleDateString("pt-PT");
  const number = quotation.number || quotation.quotation_number || "";

  const safeItems = (items || []).map(item => {
    const qty = safeNumber(item.quantity);
    const price = safeNumber(item.unit_price);
    const taxRate = safeNumber(item.tax_rate);
    const lineTotal = safeNumber(item.total) || (price * qty);
    return { description: item.description || "", quantity: qty, unit_price: price, tax_rate: taxRate, total: lineTotal };
  });

  const subtotal = safeItems.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);
  const taxTotal = safeNumber(quotation.tax_total) || safeItems.reduce((acc, i) => acc + ((i.unit_price * i.quantity * i.tax_rate) / 100), 0);
  const total = safeNumber(quotation.grand_total) || (subtotal + taxTotal);

  const companyName = company?.name || "";
  const companyLogo = company?.logoUrl || company?.logo_url || "";
  const clientName = client?.name || "";

  const contentSections: Array<{ key: string; title: string; content: string }> = [];
  if (sections.executiveSummary?.trim()) contentSections.push({ key: "exec", title: "Resumo Executivo", content: sections.executiveSummary });
  if (sections.proposedSolution?.trim()) contentSections.push({ key: "solution", title: "Solução Proposta", content: sections.proposedSolution });
  if (sections.scope?.trim()) contentSections.push({ key: "scope", title: "Escopo do Serviço", content: sections.scope });
  if (sections.timeline?.trim()) contentSections.push({ key: "timeline", title: "Cronograma Estimado", content: sections.timeline });

  let sn = contentSections.length;
  const financialNum = safeItems.length > 0 ? ++sn : 0;
  const conditionsNum = sections.conditions?.trim() ? ++sn : 0;

  return (
    <div className="printable-proposal-root pmin">
      {/* COVER */}
      <div className="pmin-cover">
        <div className="pmin-cover-top">
          {companyLogo
            ? <img src={companyLogo} className="pmin-cover-logo" alt="" />
            : (companyName && <span className="pmin-cover-brand">{companyName}</span>)
          }
        </div>
        <div className="pmin-cover-middle">
          <p className="pmin-cover-label">Proposta Comercial</p>
          <h1 className="pmin-cover-title">{clientName || "Proposta Técnica"}</h1>
          <div className="pmin-cover-line"></div>
          <div className="pmin-cover-info">
            {number && <p>{number}</p>}
            <p>{date}</p>
            {quotation.expiry_date && <p>Válida até {new Date(quotation.expiry_date).toLocaleDateString("pt-PT")}</p>}
          </div>
        </div>
        <div className="pmin-cover-bottom">
          {companyName && <p>{companyName}</p>}
          {company?.address && <p>{company.address}</p>}
          {company?.email && <p>{company.email}</p>}
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      {contentSections.map((section, idx) => (
        <div key={section.key} className="pmin-section">
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{idx + 1}.</span> {section.title}
          </h2>
          <div className="pmin-section-body"><ReactMarkdown>{section.content}</ReactMarkdown></div>
        </div>
      ))}

      {/* FINANCIAL TABLE */}
      {safeItems.length > 0 && (
        <div className="pmin-section">
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{financialNum}.</span> Investimento
          </h2>
          <table className="pmin-table">
            <thead><tr>
              <th className="pmin-th-left">Descrição</th>
              <th className="pmin-th-center">Qtd</th>
              <th className="pmin-th-right">Preço</th>
              <th className="pmin-th-center">IVA</th>
              <th className="pmin-th-right">Total</th>
            </tr></thead>
            <tbody>
              {safeItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="pmin-td-left">{item.description}</td>
                  <td className="pmin-td-center">{item.quantity}</td>
                  <td className="pmin-td-right">{safeCurrency(item.unit_price)}</td>
                  <td className="pmin-td-center">{item.tax_rate}%</td>
                  <td className="pmin-td-right">{safeCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={4} className="pmin-tfoot-label">Subtotal</td><td className="pmin-tfoot-val">{safeCurrency(subtotal)}</td></tr>
              <tr><td colSpan={4} className="pmin-tfoot-label">IVA</td><td className="pmin-tfoot-val">{safeCurrency(taxTotal)}</td></tr>
              <tr className="pmin-tfoot-total"><td colSpan={4} className="pmin-tfoot-total-label">Total</td><td className="pmin-tfoot-total-val">{safeCurrency(total)}</td></tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* CONDITIONS */}
      {sections.conditions?.trim() && (
        <div className="pmin-section">
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{conditionsNum}.</span> Condições
          </h2>
          <div className="pmin-section-body"><ReactMarkdown>{sections.conditions}</ReactMarkdown></div>
        </div>
      )}

      {/* SIGNATURES */}
      {(clientName || companyName) && (
        <div className="pmin-signatures">
          <h2 className="pmin-section-title">Aceitação</h2>
          <p className="pmin-sig-text">Ao assinar, as partes aceitam os termos desta proposta.</p>
          <div className="pmin-sig-grid">
            {companyName && (
              <div className="pmin-sig-box">
                <div className="pmin-sig-line"></div>
                <p className="pmin-sig-name">{companyName}</p>
                <p className="pmin-sig-date">Data: ___/___/______</p>
              </div>
            )}
            {clientName && (
              <div className="pmin-sig-box">
                <div className="pmin-sig-line"></div>
                <p className="pmin-sig-name">{clientName}</p>
                <p className="pmin-sig-date">Data: ___/___/______</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      {companyName && (
        <div className="pmin-footer">
          <span>{companyName}</span>
          {company?.phone && <span>{company.phone}</span>}
          {company?.email && <span>{company.email}</span>}
        </div>
      )}
    </div>
  );
}
