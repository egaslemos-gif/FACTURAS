import React from "react";
import ReactMarkdown from "react-markdown";
import { PrintableProposalProps, safeNumber, resolveVisibility } from "./proposalTypes";
import { buildProposalContentSections } from "./proposalContent";
import { FinancialTable } from "./FinancialTable";
import { ProposalPageFooters, ProposalSignatureCard, CoverFooterMask, sectionPageClass } from "./ProposalShared";

export function PrintableProposalMinimal({ company, client, quotation, items, sections, customSections, visibility: vis }: PrintableProposalProps) {
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
        <CoverFooterMask className="pmin-cover-footer-mask" />
      </div>

      {v.toc === true && (contentSections.length > 0 || showFinancial || showConditions) && (
        <div className="pmin-toc">
          <h2 className="pmin-toc-title">Índice</h2>
          <div className="pmin-toc-line" />
          <div className="pmin-toc-list">
            {contentSections.map((s, idx) => (
              <div key={s.key} className="pmin-toc-item">
                <span className="pmin-toc-num">{idx + 1}.</span>
                <span className="pmin-toc-label">{s.title}</span>
              </div>
            ))}
            {showFinancial && (
              <div className="pmin-toc-item">
                <span className="pmin-toc-num">{financialNum}.</span>
                <span className="pmin-toc-label">Investimento</span>
              </div>
            )}
            {showConditions && (
              <div className="pmin-toc-item">
                <span className="pmin-toc-num">{conditionsNum}.</span>
                <span className="pmin-toc-label">Condições</span>
              </div>
            )}
            {v.signatures && (
              <div className="pmin-toc-item">
                <span className="pmin-toc-num">&nbsp;</span>
                <span className="pmin-toc-label">Aceitação</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT SECTIONS */}
      {contentSections.map((section, idx) => (
        <div key={section.key} className={`pmin-section ${sectionPageClass(section.content)}`}>
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{idx + 1}.</span> {section.title}
          </h2>
          <div className="pmin-section-body"><ReactMarkdown>{section.content}</ReactMarkdown></div>
        </div>
      ))}

      {/* FINANCIAL TABLE */}
      {showFinancial && (
        <div className={`pmin-section ${safeItems.length > 2 ? "proposal-section-newpage" : "proposal-section-flow"}`}>
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{financialNum}.</span> Investimento
          </h2>
          <FinancialTable
            variant="minimal"
            items={safeItems}
            subtotal={subtotal}
            taxTotal={taxTotal}
            total={total}
          />
        </div>
      )}

      {/* CONDITIONS */}
      {showConditions && (
        <div className={`pmin-section ${sectionPageClass(sections.conditions)}`}>
          <h2 className="pmin-section-title">
            <span className="pmin-section-num">{conditionsNum}.</span> Condições
          </h2>
          <div className="pmin-section-body"><ReactMarkdown>{sections.conditions}</ReactMarkdown></div>
        </div>
      )}

      {/* SIGNATURES */}
      {v.signatures && (clientName || companyName) && (
        <div className="pmin-signatures">
          <h2 className="pmin-section-title">Aceitação</h2>
          <p className="pmin-sig-text">Ao assinar, as partes aceitam os termos desta proposta.</p>
          <div className="pmin-sig-grid">
            {companyName && (
              <ProposalSignatureCard
                role="Fornecedor"
                company={company}
                partyName={companyName}
                lineClassName="pmin-sig-line"
                zoneClassName="pmin-sig-zone"
                nameClassName="pmin-sig-name"
                dateClassName="pmin-sig-date"
                cardClassName="pmin-sig-box"
                showCompanyAssets
              />
            )}
            {clientName && (
              <ProposalSignatureCard
                role="Cliente"
                partyName={clientName}
                lineClassName="pmin-sig-line"
                nameClassName="pmin-sig-name"
                dateClassName="pmin-sig-date"
                cardClassName="pmin-sig-box"
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
          mainWrapperClass="pmin-footer"
          mainContentClass="pmin-footer-content"
          thanksWrapperClass="pmin-footer-thanks"
          thanksContentClass="pmin-footer-thanks-text"
        />
      )}
    </div>
  );
}
