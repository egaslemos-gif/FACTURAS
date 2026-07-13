import React from "react";
import ReactMarkdown from "react-markdown";
import { PrintableProposalProps, safeNumber, resolveVisibility } from "./proposalTypes";
import { buildProposalContentSections } from "./proposalContent";
import { FinancialTable } from "./FinancialTable";
import { ProposalPageFooters, ProposalSignatureCard, CoverFooterMask, sectionPageClass } from "./ProposalShared";

export function PrintableProposal({ company, client, quotation, items, sections, customSections, visibility: vis }: PrintableProposalProps) {
  const v = resolveVisibility(vis);
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

  const contentSections = buildProposalContentSections(sections, customSections, v);

  let sectionCounter = contentSections.length;
  const showFinancial = v.financialTable && safeItems.length > 0;
  const showConditions = v.conditions && !!sections.conditions?.trim();
  const financialNum = showFinancial ? ++sectionCounter : 0;
  const conditionsNum = showConditions ? ++sectionCounter : 0;

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
        <CoverFooterMask />
      </div>

      {v.toc === true && (contentSections.length > 0 || showFinancial || showConditions) && (
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
              </div>
            ))}
            {showFinancial && (
              <div className="printable-toc-item">
                <span className="printable-toc-num">{String(financialNum).padStart(2, "0")}</span>
                <span className="printable-toc-label">Investimento e Tabela Financeira</span>
              </div>
            )}
            {showConditions && (
              <div className="printable-toc-item">
                <span className="printable-toc-num">{String(conditionsNum).padStart(2, "0")}</span>
                <span className="printable-toc-label">Condições Gerais</span>
              </div>
            )}
            {v.signatures && (
              <div className="printable-toc-item">
                <span className="printable-toc-num">&nbsp;&nbsp;</span>
                <span className="printable-toc-label">Aceitação da Proposta</span>
              </div>
            )}
          </div>
        </div>
      )}

      {contentSections.map((section, idx) => (
        <div key={section.key} className={`printable-section ${sectionPageClass(section.content)}`}>
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

      {showFinancial && (
        <div className={`printable-section ${safeItems.length > 2 ? "proposal-section-newpage" : "proposal-section-flow"}`}>
          <div className="printable-section-header">
            <span className="printable-section-number">{String(financialNum).padStart(2, "0")}</span>
            <div className="printable-section-header-text">
              <h2 className="printable-section-title">Investimento e Tabela Financeira</h2>
              <div className="printable-section-rule"></div>
            </div>
          </div>
          <div className="printable-financial-table-wrapper">
            <FinancialTable
              variant="executivo"
              items={safeItems}
              subtotal={subtotal}
              taxTotal={taxTotal}
              total={total}
            />
          </div>
        </div>
      )}

      {showConditions && (
        <div className={`printable-section ${sectionPageClass(sections.conditions)}`}>
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

      {v.signatures && (clientName || companyName) && (
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
              <ProposalSignatureCard
                role="Pelo Fornecedor"
                company={company}
                partyName={companyName}
                lineClassName="printable-signature-line"
                zoneClassName="printable-signature-zone"
                nameClassName="printable-signature-name"
                dateClassName="printable-signature-detail"
                cardClassName="printable-signature-box"
                showCompanyAssets
              />
            )}
            {clientName && (
              <ProposalSignatureCard
                role="Pelo Cliente"
                partyName={clientName}
                lineClassName="printable-signature-line"
                nameClassName="printable-signature-name"
                dateClassName="printable-signature-detail"
                cardClassName="printable-signature-box"
              />
            )}
          </div>
          <div className="printable-signatures-legal">
            <p>Este documento constitui uma proposta comercial vinculativa após assinatura de ambas as partes.</p>
          </div>
        </div>
      )}

      {companyName && (
        <ProposalPageFooters
          company={company}
          companyName={companyName}
          mainWrapperClass="printable-running-footer"
          mainContentClass="printable-running-footer-content"
          brandClassName="printable-running-footer-company"
          sepClassName="printable-running-footer-sep"
          thanksContentClass="printable-running-footer-thanks-text"
        />
      )}
    </div>
  );
}
