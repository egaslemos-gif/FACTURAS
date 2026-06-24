import { ReactNode } from "react";
import { ClientsSplitViewClient } from "@/components/crm/ClientsSplitViewClient";

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <ClientsSplitViewClient>
      {children}
    </ClientsSplitViewClient>
  );
}
