import { openMongo } from "../lib/mongo-per-request.js";
import { getProductModel } from "../lib/models/Product.js";
import { z } from "zod";

import { requireAdmin } from "../lib/auth.js";
import { json, CreateProduct, intOr } from "../lib/helpers/products.shared.js";



export async function handler(event) {
  const { conn, close } = await openMongo();
  const Product = getProductModel(conn);

  try {
    // LIST
    if (event.httpMethod === "GET") {
      const qs = event.queryStringParameters || {};
      const page = Math.max(1, intOr(qs.page, 1));
      const pageSize = Math.min(100, Math.max(1, intOr(qs.pageSize ?? qs.limit, 12)));
      const q = (qs.q || qs.name || "").trim();

      const filter = {};
      if (q) {
        // If you created the text index, prefer this:
        // filter.$text = { $search: q };
        filter.name = { $regex: q, $options: "i" };
      }

      const [total, items] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean()
          .exec(),
      ]);

      return json(200, { page, pageSize, total, items });
    }

    // CREATE
    if (event.httpMethod === "POST") {
      const gate = requireAdmin(event);
      if (!gate.ok) return json(gate.status, gate.body);

      
      let body;
      try { body = JSON.parse(event.body || "{}"); }
      catch { return json(400, { message: "invalid JSON body" }); }

      const parsed = CreateProduct.safeParse(body);
      if (!parsed.success) {
        return json(400, { message: "invalid body", issues: parsed.error.format() });
      }

      const doc = await Product.create(parsed.data);
      return json(201, doc);
    }

    return json(405, { message: "Method not allowed" });
  } catch (e) {
    return json(500, { message: "server error", error: String(e) });
  } finally {
    await close(); // 🔒 always close
  }
}