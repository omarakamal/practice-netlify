import bcrypt from "bcryptjs";
import { openMongo } from "../lib/mongo-per-request.js";
import { getUserModel } from "../lib/models/User.js";
import { json } from "../lib/helpers/products.shared.js";


function allowed(event) {
  const qs = event.queryStringParameters || {};
  console.log(qs)
  console.log(process.env.SEED_SECRET)
  return process.env.SEED_SECRET && (qs.secret || "") === process.env.SEED_SECRET;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { message: "Method not allowed" });
  // if (!allowed(event)) return json(403, { message: "forbidden" });

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return json(400, { message: "missing ADMIN_EMAIL/ADMIN_PASSWORD" });

  const { conn, close } = await openMongo();
  const User = getUserModel(conn);
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL }).lean().exec();
    if (existing) return json(200, { message: "admin already exists", email: ADMIN_EMAIL });

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({ email: ADMIN_EMAIL, passwordHash, role: "admin" });
    return json(201, { message: "admin created", email: ADMIN_EMAIL });
  } catch (e) {
    return json(500, { message: "seed failed", error: String(e) });
  } finally {
    await close();
  }
}
