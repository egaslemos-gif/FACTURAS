import { dbClient } from "../client";
import { Product } from "../../types";
import { generateId, now } from "../../utils";

export const productsRepo = {
  async getAll(): Promise<Product[]> {
    const data = await dbClient.query("SELECT * FROM products ORDER BY name ASC");
    return data as Product[];
  },

  async getById(id: string): Promise<Product | null> {
    const data = await dbClient.getOne("SELECT * FROM products WHERE id = ?", [id]);
    return data as Product | null;
  },

  async create(productData: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const timestamp = now();
    const newProduct = {
      id: generateId(),
      ...productData,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const keys = Object.keys(newProduct).join(", ");
    const placeholders = Object.keys(newProduct).fill("?").join(", ");
    const values = Object.values(newProduct);

    const query = `INSERT INTO products (${keys}) VALUES (${placeholders})`;
    await dbClient.executeWrite(query, values);

    return newProduct as Product;
  },

  async update(id: string, productData: Partial<Product>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    const timestamp = now();

    Object.entries(productData).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    await dbClient.executeWrite(query, values);
  },

  async delete(id: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM products WHERE id = ?", [id]);
  },
};
