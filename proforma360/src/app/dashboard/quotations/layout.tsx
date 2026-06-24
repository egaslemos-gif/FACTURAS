import { ReactNode } from "react";
import { QuotationsSplitViewClient } from "@/components/crm/QuotationsSplitViewClient";

export default function QuotationsLayout({ children }: { children: ReactNode }) {
  return (
    <QuotationsSplitViewClient>
      {children}
    </QuotationsSplitViewClient>
  );
}
