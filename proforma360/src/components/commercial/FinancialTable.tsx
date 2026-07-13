import { formatCurrency } from "@/lib/utils";
import { safeNumber } from "./proposalTypes";

function safeCurrency(val: unknown): string {
  return formatCurrency(safeNumber(val));
}

export interface FinancialRow {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

interface FinancialTableProps {
  items: FinancialRow[];
  subtotal: number;
  taxTotal: number;
  total: number;
  variant: "executivo" | "minimal" | "corporate";
}

function ColGroup({ variant }: { variant: "executivo" | "minimal" | "corporate" }) {
  const widths =
    variant === "corporate"
      ? ["42%", "7%", "17%", "8%", "26%"]
      : ["44%", "8%", "18%", "8%", "22%"];
  return (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

export function FinancialTable({ items, subtotal, taxTotal, total, variant }: FinancialTableProps) {
  if (variant === "minimal") {
    return (
      <table className="pmin-table">
        <ColGroup variant="minimal" />
        <thead><tr>
          <th className="pmin-th-left">Descrição</th>
          <th className="pmin-th-center">Qtd</th>
          <th className="pmin-th-right">Preço</th>
          <th className="pmin-th-center">IVA</th>
          <th className="pmin-th-right">Total</th>
        </tr></thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="pmin-td-left">{item.description}</td>
              <td className="pmin-td-center pmin-td-num">{item.quantity}</td>
              <td className="pmin-td-right pmin-td-num">{safeCurrency(item.unit_price)}</td>
              <td className="pmin-td-center pmin-td-num">{item.tax_rate}%</td>
              <td className="pmin-td-right pmin-td-num">{safeCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="pmin-tfoot-label">Subtotal</td><td className="pmin-tfoot-val">{safeCurrency(subtotal)}</td></tr>
          <tr><td colSpan={4} className="pmin-tfoot-label">IVA</td><td className="pmin-tfoot-val">{safeCurrency(taxTotal)}</td></tr>
          <tr className="pmin-tfoot-total"><td colSpan={4} className="pmin-tfoot-total-label">Total</td><td className="pmin-tfoot-total-val">{safeCurrency(total)}</td></tr>
        </tfoot>
      </table>
    );
  }

  if (variant === "corporate") {
    return (
      <table className="pcorp-table">
        <ColGroup variant="corporate" />
        <thead><tr>
          <th className="pcorp-th pcorp-th-left">Item</th>
          <th className="pcorp-th pcorp-th-center">Qtd</th>
          <th className="pcorp-th pcorp-th-right">Preço</th>
          <th className="pcorp-th pcorp-th-center">IVA</th>
          <th className="pcorp-th pcorp-th-right">Total</th>
        </tr></thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 1 ? "pcorp-tr-alt" : ""}>
              <td className="pcorp-td pcorp-td-left pcorp-td-bold">{item.description}</td>
              <td className="pcorp-td pcorp-td-center pcorp-td-num">{item.quantity}</td>
              <td className="pcorp-td pcorp-td-right pcorp-td-num">{safeCurrency(item.unit_price)}</td>
              <td className="pcorp-td pcorp-td-center pcorp-td-num">{item.tax_rate}%</td>
              <td className="pcorp-td pcorp-td-right pcorp-td-num pcorp-td-bold">{safeCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="pcorp-tf-label">Subtotal</td><td className="pcorp-tf-val">{safeCurrency(subtotal)}</td></tr>
          <tr><td colSpan={4} className="pcorp-tf-label">IVA</td><td className="pcorp-tf-val">{safeCurrency(taxTotal)}</td></tr>
          <tr className="pcorp-tf-total"><td colSpan={4} className="pcorp-tf-total-label">TOTAL</td><td className="pcorp-tf-total-val">{safeCurrency(total)}</td></tr>
        </tfoot>
      </table>
    );
  }

  return (
    <table className="printable-financial-table">
      <ColGroup variant="executivo" />
      <thead><tr>
        <th className="printable-th printable-th-item">Descrição</th>
        <th className="printable-th printable-th-qty">Qtd</th>
        <th className="printable-th printable-th-price">Preço Unit.</th>
        <th className="printable-th printable-th-tax">IVA</th>
        <th className="printable-th printable-th-total">Total</th>
      </tr></thead>
      <tbody>
        {items.map((item, idx) => (
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
  );
}
