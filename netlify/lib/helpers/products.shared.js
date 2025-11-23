// netlify/functions/products.shared.js
import { z } from "zod";

export function json(status, body, header={}){
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...header },
    body: JSON.stringify(body)

  }
}

export const intOr = (value, defaultValue) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : defaultValue;
};

export const CreateProduct = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  description: z.string().optional().default(""),
  imageUrl: z.string().url().optional().default(""),
});



export const UpdateProduct = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
}).strict();




export function getId(event) {
  const qsId = event?.queryStringParameters?.id?.trim();
  if (qsId) return qsId;
  const parts = (event.path || "").split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2] || "";
  if (prev === "products" || prev === "product-by-id") return last;
  return null;
}
