import React from "react";
import ReactMarkdown from "react-markdown";
import { formatCurrency } from "@/lib/utils";
import { PrintableProposalProps, safeNumber } from "./proposalTypes";

function safeCurrency(val: unknown): string {
  return formatCurrency(safeNumber(val));
}

export function PrintableProposalCorporate({ company, client, quotation, items, sections }: PrintableProposalProps) {
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
    <div className="printable-proposal-root pcorp">
      {/* COVER */}
      <div className="pcorp-cover">
        <div className="pcorp-cover-stripe"></div>
        <div className="pcorp-cover-content">
          <div className="pcorp-cover-logo-area">
            {companyLogo
              ? <img src={companyLogo} className="pcorp-cover-logo" alt="" />
              : (companyName && <span className="pcorp-cover-brand">{companyName}</span>)
            }
          </div>
          <div className="pcorp-cover-center">
            <h1 className="pcorp-cover-title">Proposta<br/>Comercial</h1>
            <div className="pcorp-cover-divider"></div>
          </div>
          <div className="pcorp-cover-details">
            <div className="pcorp-cover-col">
              <p className="pcorp-cover-heading">Preparada para</p>
              {clientName && <p className="pcorp-cover-value">{clientName}</p>}
              {client?.email && <p className="pcorp-cover-sub">{client.email}</p>}
            </div>
            <div className="pcorp-cover-col">
              <p className="pcorp-cover-heading">Detalhes</p>
              {number && <p className="pcorp-cover-value">Ref: {number}</p>}
              <p className="pcorp-cover-sub">Data: {date}</p>
              {quotation.expiry_date && <p className="pcorp-cover-sub">Validade: {new Date(quotation.expiry_date).toLocaleDateString("pt-PT")}</p>}
            </div>
          </div>
        </div>
        <div className="pcorp-cover-footer">
          {companyName && <p className="pcorp-cover-footer-name">{companyName}</p>}
          {company?.address && <p className="pcorp-cover-footer-addr">{company.address}</p>}
        </div>
      </div>

      {/* TOC */}
      {contentSections.length > 0 && (
        <div className="pcorp-toc">
          <div className="pcorp-toc-bar"></div>
          <h2 className="pcorp-toc-title">Conteúdo</h2>
          {contentSections.map((s, idx) => (
            <div key={s.key} className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(idx + 1).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">{s.title}</span>
            </div>
          ))}
          {financialNum > 0 && (
            <div className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(financialNum).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">Investimento</span>
            </div>
          )}
          {conditionsNum > 0 && (
            <div className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(conditionsNum).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">Condições Gerais</span>
            </div>
          )}
        </div>
      )}

      {/* SECTIONS */}
      {contentSections.map((section, idx) => (
        <div key={section.key} className="pcorp-section">
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(idx + 1).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">{section.title}</h2>
          </div>
          <div className="pcorp-section-body"><ReactMarkdown>{section.content}</ReactMarkdown></div>
        </div>
      ))}

      {/* FINANCIAL TABLE */}
      {safeItems.length > 0 && (
        <div className="pcorp-section">
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(financialNum).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">Investimento</h2>
          </div>
          <table className="pcorp-table">
            <thead><tr>
              <th className="pcorp-th pcorp-th-left">Item</th>
              <th className="pcorp-th pcorp-th-center">Qtd</th>
              <th className="pcorp-th pcorp-th-right">Preço Unit.</th>
              <th className="pcorp-th pcorp-th-center">IVA</th>
              <th className="pcorp-th pcorp-th-right">Total</th>
            </tr></thead>
            <tbody>
              {safeItems.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? "pcorp-tr-alt" : ""}>
                  <td className="pcorp-td pcorp-td-left pcorp-td-bold">{item.description}</td>
                  <td className="pcorp-td pcorp-td-center">{item.quantity}</td>
                  <td className="pcorp-td pcorp-td-right">{safeCurrency(item.unit_price)}</td>
                  <td className="pcorp-td pcorp-td-center">{item.tax_rate}%</td>
                  <td className="pcorp-td pcorp-td-right pcorp-td-bold">{safeCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={4} className="pcorp-tf-label">Subtotal</td><td className="pcorp-tf-val">{safeCurrency(subtotal)}</td></tr>
              <tr><td colSpan={4} className="pcorp-tf-label">IVA</td><td className="pcorp-tf-val">{safeCurrency(taxTotal)}</td></tr>
              <tr className="pcorp-tf-total"><td colSpan={4} className="pcorp-tf-total-label">TOTAL</td><td className="pcorp-tf-total-val">{safeCurrency(total)}</td></tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* CONDITIONS */}
      {sections.conditions?.trim() && (
        <div className="pcorp-section">
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(conditionsNum).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">Condições Gerais</h2>
          </div>
          <div className="pcorp-section-body"><ReactMarkdown>{sections.conditions}</ReactMarkdown></div>
        </div>
      )}

      {/* SIGNATURES */}
      {(clientName || companyName) && (
        <div className="pcorp-signatures">
          <div className="pcorp-sig-header">
            <div className="pcorp-section-badge-dark">✓</div>
            <h2 className="pcorp-section-title">Formalização e Aceite</h2>
          </div>
          <div className="pcorp-sig-intro">
            <p>As partes abaixo identificadas declaram que leram e aceitam integralmente os termos e condições constantes nesta proposta comercial{number ? `, referência ${number}` : ""}.</p>
          </div>
          <div className="pcorp-sig-grid">
            {companyName && (
              <div className="pcorp-sig-card">
                <p className="pcorp-sig-role">Fornecedor</p>
                <div className="pcorp-sig-line"></div>
                <p className="pcorp-sig-name">{companyName}</p>
                <p className="pcorp-sig-meta">Assinatura e carimbo</p>
                <p className="pcorp-sig-meta">Data: ____/____/________</p>
              </div>
            )}
            {clientName && (
              <div className="pcorp-sig-card">
                <p className="pcorp-sig-role">Cliente</p>
                <div className="pcorp-sig-line"></div>
                <p className="pcorp-sig-name">{clientName}</p>
                <p className="pcorp-sig-meta">Assinatura e carimbo</p>
                <p className="pcorp-sig-meta">Data: ____/____/________</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      {companyName && (
        <div className="pcorp-footer">
          <div className="pcorp-footer-bar"></div>
          <div className="pcorp-footer-content">
            <span className="pcorp-footer-brand">{companyName}</span>
            {company?.address && <span>{company.address}</span>}
            {company?.phone && <span>{company.phone}</span>}
            {company?.email && <span>{company.email}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
