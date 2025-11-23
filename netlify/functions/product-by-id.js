import mongoose from "mongoose";
import { openMongo } from "../lib/mongo-per-request.js";
import { getProductModel } from "../lib/models/Product.js";
import { json, UpdateProduct, getId } from "../lib/helpers/products.shared.js";
import { requireAdmin } from "../lib/auth.js";

export async function handler(event) {
  const { conn, close } = await openMongo();
  const Product = getProductModel(conn);

  try {
    const id = getId(event);
    if (!id) return json(400, { message: "missing product id" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return json(400, { message: "invalid product id" });

    if (event.httpMethod === "GET") {
      const doc = await Product.findById(id).lean().exec();
      if (!doc) return json(404, { message: "product not found" });
      return json(200, doc);
    }

    if (event.httpMethod === "PUT" || event.httpMethod === "PATCH") {
      const gate = requireAdmin(event);
      if (!gate.ok) return json(gate.status, gate.body);

      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { message: "invalid JSON body" });
      }

      const parsed = UpdateProduct.safeParse(body);
      if (!parsed.success) {
        return json(400, {
          message: "invalid body",
          issues: parsed.error.format(),
        });
      }

      const updated = await Product.findByIdAndUpdate(
        id,
        { $set: parsed.data },
        { new: true, runValidators: true }
      )
        .lean()
        .exec();

      if (!updated) return json(404, { message: "product not found" });
      return json(200, updated);
    }

    if (event.httpMethod === "DELETE") {
      const gate = requireAdmin(event);
      if (!gate.ok) return json(gate.status, gate.body);

      const res = await Product.findByIdAndDelete(id).lean().exec();
      if (!res) return json(404, { message: "product not found" });
      return {
        statusCode: 204,
        headers: { "Content-Type": "application/json" },
        body: "",
      };
    }

    return json(405, { message: "Method not allowed" });
  } catch (e) {
    return json(500, { message: "server error", error: String(e) });
  } finally {
    await close(); // 🔒 always close
  }
}
