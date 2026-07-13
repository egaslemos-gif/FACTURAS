import React from "react";
import ReactMarkdown from "react-markdown";
import { formatCurrency } from "@/lib/utils";
import { PrintableProposalProps, safeNumber } from "./proposalTypes";

function safeCurrency(val: unknown): string {
  return formatCurrency(safeNumber(val));
}

export function PrintableProposal({ company, client, quotation, items, sections }: PrintableProposalProps) {
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

  let sectionCounter = contentSections.length;
  const financialNum = safeItems.length > 0 ? ++sectionCounter : 0;
  const conditionsNum = sections.conditions?.trim() ? ++sectionCounter : 0;

  return (
    <div className="printable-proposal-root">
      <div className="printable-cover">
        <div className="printable-cover-logo">
          {companyLogo ? <img src={companyLogo} className="printable-cover-logo-img" alt="" /> : (companyName && <span className="printable-cover-company-text">{companyName}</span>)}
        </div>
        <div className="printable-cover-center">
          <h1 className="printable-cover-title">PROPOSTA COMERCIAL</h1>
          <div className="printable-cover-divider"></div>
          <div className="printable-cover-meta">
            {clientName && <p><strong>Cliente:</strong> {clientName}</p>}
            {companyName && <p><strong>Empresa:</strong> {companyName}</p>}
            {number && <p><strong>Referência:</strong> {number}</p>}
            <p><strong>Data:</strong> {date}</p>
            {quotation.expiry_date && <p><strong>Validade:</strong> {new Date(quotation.expiry_date).toLocaleDateString("pt-PT")}</p>}
          </div>
        </div>
        {companyName && (
          <div className="printable-cover-bottom">
            <p className="printable-cover-footer-label">Preparada por:</p>
            <p className="printable-cover-footer-name">{companyName}</p>
          </div>
        )}
      </div>

      {contentSections.length > 0 && (
        <div className="printable-toc">
          <div className="printable-toc-header">
            <div className="printable-toc-accent"></div>
            <h2 className="printable-toc-title">Índice</h2>
          </div>
          <div className="printable-toc-list">
            {contentSections.map((s, idx) => (
              <div key={s.key} className="printable-toc-item">
                <span className="printable-toc-num">{String(idx + 1).padStart(2, "0")}</span>
                <span className="printable-toc-label">{s.title}</span>
                <span className="printable-toc-dots"></span>
              </div>
            ))}
            {financialNum > 0 && (
              <div className="printable-toc-item">
                <span className="printable-toc-num">{String(financialNum).padStart(2, "0")}</span>
                <span className="printable-toc-label">Investimento e Tabela Financeira</span>
                <span className="printable-toc-dots"></span>
              </div>
            )}
            {conditionsNum > 0 && (
              <div className="printable-toc-item">
                <span className="printable-toc-num">{String(conditionsNum).padStart(2, "0")}</span>
                <span className="printable-toc-label">Condições Gerais</span>
                <span className="printable-toc-dots"></span>
              </div>
            )}
            <div className="printable-toc-item">
              <span className="printable-toc-num">&nbsp;&nbsp;</span>
              <span className="printable-toc-label">Aceitação da Proposta</span>
              <span className="printable-toc-dots"></span>
            </div>
          </div>
        </div>
      )}

      {contentSections.map((section, idx) => (
        <div key={section.key} className="printable-section">
          <div className="printable-section-header">
            <span className="printable-section-number">{String(idx + 1).padStart(2, "0")}</span>
            <div className="printable-section-header-text">
              <h2 className="printable-section-title">{section.title}</h2>
              <div className="printable-section-rule"></div>
            </div>
          </div>
          <div className="printable-section-content"><ReactMarkdown>{section.content}</ReactMarkdown></div>
        </div>
      ))}

      {safeItems.length > 0 && (
        <div className="printable-section">
          <div className="printable-section-header">
            <span className="printable-section-number">{String(financialNum).padStart(2, "0")}</span>
            <div className="printable-section-header-text">
              <h2 className="printable-section-title">Investimento e Tabela Financeira</h2>
              <div className="printable-section-rule"></div>
            </div>
          </div>
          <div className="printable-financial-table-wrapper">
            <table className="printable-financial-table">
              <thead><tr>
                <th className="printable-th printable-th-item">Item / Descrição</th>
                <th className="printable-th printable-th-qty">Qtd.</th>
                <th className="printable-th printable-th-price">Preço Unit.</th>
                <th className="printable-th printable-th-tax">IVA</th>
                <th className="printable-th printable-th-total">Total</th>
              </tr></thead>
              <tbody>
                {safeItems.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "printable-tr-even" : "printable-tr-odd"}>
                    <td className="printable-td printable-td-item">{item.description}</td>
                    <td className="printable-td printable-td-qty">{item.quantity}</td>
                    <td className="printable-td printable-td-price">{safeCurrency(item.unit_price)}</td>
                    <td className="printable-td printable-td-tax">{item.tax_rate}%</td>
                    <td className="printable-td printable-td-total">{safeCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="printable-tfoot-row"><td colSpan={4} className="printable-tfoot-label">Subtotal</td><td className="printable-tfoot-value">{safeCurrency(subtotal)}</td></tr>
                <tr className="printable-tfoot-row"><td colSpan={4} className="printable-tfoot-label">IVA</td><td className="printable-tfoot-value">{safeCurrency(taxTotal)}</td></tr>
                <tr className="printable-tfoot-total"><td colSpan={4} className="printable-tfoot-total-label">TOTAL GERAL</td><td className="printable-tfoot-total-value">{safeCurrency(total)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {sections.conditions?.trim() && (
        <div className="printable-section">
          <div className="printable-section-header">
            <span className="printable-section-number">{String(conditionsNum).padStart(2, "0")}</span>
            <div className="printable-section-header-text">
              <h2 className="printable-section-title">Condições Gerais</h2>
              <div className="printable-section-rule"></div>
            </div>
          </div>
          <div className="printable-section-content"><ReactMarkdown>{sections.conditions}</ReactMarkdown></div>
        </div>
      )}

      {(clientName || companyName) && (
        <div className="printable-signatures">
          <div className="printable-signatures-header">
            <div className="printable-toc-accent"></div>
            <h2 className="printable-signatures-title">Aceitação da Proposta</h2>
          </div>
          <div className="printable-signatures-intro">
            <p>Declaro que li e aceito integralmente os termos, condições comerciais, escopo de trabalho e cronograma descritos nesta proposta.</p>
            {number && <p className="printable-signatures-ref">Referência: <strong>{number}</strong></p>}
            <p className="printable-signatures-ref">Data: <strong>{date}</strong></p>
          </div>
          <div className="printable-signatures-block">
            {companyName && (
              <div className="printable-signature-box">
                <p className="printable-signature-role">Pelo Fornecedor</p>
                <div className="printable-signature-line"></div>
                <p className="printable-signature-name">{companyName}</p>
                <p className="printable-signature-detail">Data: ____/____/________</p>
              </div>
            )}
            {clientName && (
              <div className="printable-signature-box">
                <p className="printable-signature-role">Pelo Cliente</p>
                <div className="printable-signature-line"></div>
                <p className="printable-signature-name">{clientName}</p>
                <p className="printable-signature-detail">Data: ____/____/________</p>
              </div>
            )}
          </div>
          <div className="printable-signatures-legal">
            <p>Este documento constitui uma proposta comercial vinculativa após assinatura de ambas as partes.</p>
          </div>
        </div>
      )}

      {companyName && (
        <div className="printable-running-footer">
          <div className="printable-running-footer-content">
            <span className="printable-running-footer-company">{companyName}</span>
            {company?.address && <><span className="printable-running-footer-sep">|</span><span>{company.address}</span></>}
            {company?.phone && <><span className="printable-running-footer-sep">|</span><span>{company.phone}</span></>}
            {company?.email && <><span className="printable-running-footer-sep">|</span><span>{company.email}</span></>}
          </div>
        </div>
      )}
    </div>
  );
}
