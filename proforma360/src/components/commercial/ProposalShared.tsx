import React from "react";
import type { ProposalCompany } from "./proposalTypes";

export interface FooterParts {
  mainLines: string[];
  thanksLine: string | null;
}

export function splitFooterText(footerText: string): FooterParts {
  const lines = footerText.split("\n").map((l) => l.trim()).filter(Boolean);
  const mainLines: string[] = [];
  let thanksLine: string | null = null;

  for (const line of lines) {
    if (/obrigad/i.test(line)) {
      thanksLine = line;
    } else {
      mainLines.push(line);
    }
  }

  return { mainLines, thanksLine };
}

export function getFooterParts(
  company: ProposalCompany | null,
  companyName: string
): FooterParts {
  if (company?.footer_text?.trim()) {
    return splitFooterText(company.footer_text);
  }

  const mainLines = [
    companyName,
    company?.address,
    company?.phone,
    company?.email,
  ].filter((line): line is string => Boolean(line?.trim()));

  return { mainLines, thanksLine: null };
}

export function ProposalRunningFooter({
  company,
  companyName,
  className = "",
  brandClassName,
  sepClassName,
  part = "all",
}: {
  company: ProposalCompany | null;
  companyName: string;
  className?: string;
  brandClassName?: string;
  sepClassName?: string;
  part?: "all" | "main" | "thanks";
}) {
  const { mainLines, thanksLine } = getFooterParts(company, companyName);

  if (part === "thanks") {
    if (!thanksLine) return null;
    return <div className={className}><span>{thanksLine}</span></div>;
  }

  const lines = part === "main" && thanksLine ? mainLines : part === "all" ? [...mainLines, ...(thanksLine ? [thanksLine] : [])] : mainLines;

  if (lines.length === 0) return null;

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && sepClassName && <span className={sepClassName}>|</span>}
          <span className={i === 0 && brandClassName ? brandClassName : undefined}>{line}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function ProposalPageFooters({
  company,
  companyName,
  mainWrapperClass,
  mainContentClass,
  brandClassName,
  sepClassName,
  thanksWrapperClass = "proposal-footer-thanks",
  thanksContentClass,
  header,
}: {
  company: ProposalCompany | null;
  companyName: string;
  mainWrapperClass: string;
  mainContentClass: string;
  brandClassName?: string;
  sepClassName?: string;
  thanksWrapperClass?: string;
  thanksContentClass?: string;
  header?: React.ReactNode;
}) {
  const { thanksLine } = getFooterParts(company, companyName);
  if (!companyName && !company?.footer_text) return null;

  return (
    <>
      <div className={mainWrapperClass}>
        {header}
        <ProposalRunningFooter
          company={company}
          companyName={companyName}
          className={mainContentClass}
          brandClassName={brandClassName}
          sepClassName={sepClassName}
          part="main"
        />
      </div>
      {thanksLine && (
        <div className={thanksWrapperClass}>
          <ProposalRunningFooter
            company={company}
            companyName={companyName}
            className={thanksContentClass || mainContentClass}
            part="thanks"
          />
        </div>
      )}
    </>
  );
}

/** Assinatura sobreposta ao carimbo; nome centrado no carimbo (estilo proforma) */
export function ProposalSignatureZone({
  company,
  partyName,
  lineClassName,
  zoneClassName = "proposal-sig-zone",
}: {
  company: ProposalCompany | null;
  partyName?: string;
  lineClassName: string;
  zoneClassName?: string;
}) {
  const signature = company?.signature_url;
  const stamp = company?.stamp_url;

  if (signature || stamp || partyName) {
    return (
      <div className={`${zoneClassName} proposal-sig-composite`}>
        {(stamp || partyName) && (
          <div className="proposal-stamp-layer">
            {stamp && <img src={stamp} alt="" className="proposal-stamp-image" />}
            {partyName && <p className="proposal-sig-name-on-stamp">{partyName}</p>}
          </div>
        )}
        {signature && <img src={signature} alt="" className="proposal-sig-over-stamp" />}
      </div>
    );
  }

  return <div className={lineClassName} />;
}

export function ProposalSignatureCard({
  role,
  company,
  partyName,
  lineClassName,
  zoneClassName,
  nameClassName = "proposal-sig-name",
  dateClassName = "proposal-sig-date",
  cardClassName = "",
  showCompanyAssets = false,
}: {
  role: string;
  company?: ProposalCompany | null;
  partyName: string;
  lineClassName: string;
  zoneClassName?: string;
  nameClassName?: string;
  dateClassName?: string;
  cardClassName?: string;
  showCompanyAssets?: boolean;
}) {
  return (
    <div className={`proposal-sig-card ${cardClassName}`.trim()}>
      <p className="proposal-sig-role">{role}</p>
      <div className="proposal-sig-body">
        {showCompanyAssets ? (
          <ProposalSignatureZone
            company={company ?? null}
            partyName={partyName}
            lineClassName={lineClassName}
            zoneClassName={zoneClassName}
          />
        ) : (
          <div className="proposal-sig-client-block">
            <div className={lineClassName} />
            <p className={nameClassName}>{partyName}</p>
          </div>
        )}
      </div>
      <p className={`proposal-sig-date-line ${dateClassName}`.trim()}>Data: ____/____/________</p>
    </div>
  );
}

export function CoverFooterMask({ className = "proposal-cover-footer-mask" }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

export function sectionPageClass(content?: string): string {
  if (!content?.trim()) return "";
  const len = content.trim().length;
  return len >= 320 ? "proposal-section-newpage" : "proposal-section-flow";
}
