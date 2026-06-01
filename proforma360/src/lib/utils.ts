import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para a moeda MZN
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata uma data para o formato português
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Gera o próximo número de proforma
 * Formato: PF-2026-0001
 */
export function generateQuotationNumber(
  lastNumber: string | null,
  prefix: string = "PF"
): string {
  const year = new Date().getFullYear();

  if (!lastNumber) {
    return `${prefix}-${year}-0001`;
  }

  const parts = lastNumber.split("-");
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const lastYear = parseInt(parts[parts.length - 2], 10);

  if (lastYear !== year) {
    return `${prefix}-${year}-0001`;
  }

  const nextSeq = (lastSeq + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${nextSeq}`;
}

/**
 * Debounce para pesquisa
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Obtém as iniciais de um nome
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Timestamp ISO atual
 */
export function now(): string {
  return new Date().toISOString();
}
