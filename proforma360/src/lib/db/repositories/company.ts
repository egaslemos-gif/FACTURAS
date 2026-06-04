import { dbClient } from "../client";
import { Company } from "../../types";
import { generateId, now } from "../../utils";

export const companyRepo = {
  async get(): Promise<Company | null> {
    const data = await dbClient.getOne("SELECT * FROM companies LIMIT 1") as any;
    if (data) {
      data.show_branding = data.show_branding === undefined ? true : Boolean(data.show_branding);
    }
    return data as Company | null;
  },

  async upsert(companyData: Partial<Company>): Promise<Company> {
    const existing = await this.get();
    const timestamp = now();

    if (existing) {
      // Update
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(companyData).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          updates.push(`${key} = ?`);
          values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
        }
      });

      updates.push("updated_at = ?");
      values.push(timestamp);
      values.push(existing.id);

      const query = `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`;
      await dbClient.executeWrite(query, values);

      return { ...existing, ...companyData, updated_at: timestamp } as Company;
    } else {
      // Create
      const id = generateId();
      const newCompany = {
        id,
        name: companyData.name || "",
        tax_number: companyData.tax_number || "",
        address: companyData.address || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        logo_url: companyData.logo_url || null,
        signature_url: companyData.signature_url || null,
        stamp_url: companyData.stamp_url || null,
        footer_text: companyData.footer_text || null,
        quotation_prefix: companyData.quotation_prefix || "PF",
        show_branding: companyData.show_branding ?? true,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const keys = Object.keys(newCompany).join(", ");
      const placeholders = Object.keys(newCompany).fill("?").join(", ");
      const values = Object.values(newCompany);

      const query = `INSERT INTO companies (${keys}) VALUES (${placeholders})`;
      await dbClient.executeWrite(query, values);

      return newCompany as Company;
    }
  },
};
