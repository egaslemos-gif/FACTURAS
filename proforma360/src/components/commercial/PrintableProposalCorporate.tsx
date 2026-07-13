import React from "react";
import ReactMarkdown from "react-markdown";
import { PrintableProposalProps, safeNumber, resolveVisibility } from "./proposalTypes";
import { buildProposalContentSections } from "./proposalContent";
import { FinancialTable } from "./FinancialTable";
import { ProposalPageFooters, ProposalSignatureCard, CoverFooterMask, sectionPageClass } from "./ProposalShared";

export function PrintableProposalCorporate({ company, client, quotation, items, sections, customSections, visibility: vis }: PrintableProposalProps) {
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

  let sn = contentSections.length;
  const showFinancial = v.financialTable && safeItems.length > 0;
  const showConditions = v.conditions && !!sections.conditions?.trim();
  const financialNum = showFinancial ? ++sn : 0;
  const conditionsNum = showConditions ? ++sn : 0;

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
        <CoverFooterMask className="pcorp-cover-footer-mask" />
      </div>

      {/* TOC */}
      {v.toc === true && (contentSections.length > 0 || showFinancial || showConditions) && (
        <div className="pcorp-toc">
          <div className="pcorp-toc-bar"></div>
          <h2 className="pcorp-toc-title">Conteúdo</h2>
          {contentSections.map((s, idx) => (
            <div key={s.key} className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(idx + 1).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">{s.title}</span>
            </div>
          ))}
          {showFinancial && (
            <div className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(financialNum).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">Investimento</span>
            </div>
          )}
          {showConditions && (
            <div className="pcorp-toc-row">
              <span className="pcorp-toc-num">{String(conditionsNum).padStart(2, "0")}</span>
              <span className="pcorp-toc-name">Condições Gerais</span>
            </div>
          )}
        </div>
      )}

      {/* SECTIONS */}
      {contentSections.map((section, idx) => (
        <div key={section.key} className={`pcorp-section ${sectionPageClass(section.content)}`}>
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(idx + 1).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">{section.title}</h2>
          </div>
          <div className="pcorp-section-body"><ReactMarkdown>{section.content}</ReactMarkdown></div>
        </div>
      ))}

      {/* FINANCIAL TABLE */}
      {showFinancial && (
        <div className={`pcorp-section ${safeItems.length > 2 ? "proposal-section-newpage" : "proposal-section-flow"}`}>
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(financialNum).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">Investimento</h2>
          </div>
          <FinancialTable
            variant="corporate"
            items={safeItems}
            subtotal={subtotal}
            taxTotal={taxTotal}
            total={total}
          />
        </div>
      )}

      {showConditions && (
        <div className={`pcorp-section ${sectionPageClass(sections.conditions)}`}>
          <div className="pcorp-section-head">
            <div className="pcorp-section-badge">{String(conditionsNum).padStart(2, "0")}</div>
            <h2 className="pcorp-section-title">Condições Gerais</h2>
          </div>
          <div className="pcorp-section-body"><ReactMarkdown>{sections.conditions}</ReactMarkdown></div>
        </div>
      )}

      {/* SIGNATURES */}
      {v.signatures && (clientName || companyName) && (
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
              <ProposalSignatureCard
                role="Fornecedor"
                company={company}
                partyName={companyName}
                lineClassName="pcorp-sig-line"
                zoneClassName="pcorp-sig-zone"
                nameClassName="pcorp-sig-name"
                dateClassName="pcorp-sig-meta"
                cardClassName="pcorp-sig-card"
                showCompanyAssets
              />
            )}
            {clientName && (
              <ProposalSignatureCard
                role="Cliente"
                partyName={clientName}
                lineClassName="pcorp-sig-line"
                nameClassName="pcorp-sig-name"
                dateClassName="pcorp-sig-meta"
                cardClassName="pcorp-sig-card"
              />
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      {companyName && (
        <ProposalPageFooters
          company={company}
          companyName={companyName}
          mainWrapperClass="pcorp-footer"
          mainContentClass="pcorp-footer-content"
          brandClassName="pcorp-footer-brand"
          thanksWrapperClass="pcorp-footer-thanks"
          thanksContentClass="pcorp-footer-thanks-text"
          header={<div className="pcorp-footer-bar" />}
        />
      )}
    </div>
  );
}
