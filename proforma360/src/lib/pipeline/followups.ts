export interface QuickTemplate {
  id: string;
  title: string;
  action: string;
  priority: "low" | "medium" | "high";
  daysOffset: number; // How many days from today
}

export const FOLLOWUP_TEMPLATES: QuickTemplate[] = [
  {
    id: "tpl-1",
    title: "Ligar amanhã",
    action: "Ligar para acompanhamento",
    priority: "medium",
    daysOffset: 1,
  },
  {
    id: "tpl-2",
    title: "Enviar revisão hoje",
    action: "Enviar proforma revista",
    priority: "high",
    daysOffset: 0,
  },
  {
    id: "tpl-3",
    title: "Confirmar receção",
    action: "Confirmar se o cliente recebeu o email",
    priority: "low",
    daysOffset: 2,
  },
  {
    id: "tpl-4",
    title: "Cobrança amigável",
    action: "Questionar sobre decisão / pagamento",
    priority: "medium",
    daysOffset: 3,
  }
];

export function applyTemplateDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}
