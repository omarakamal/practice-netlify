// netlify/lib/mongo-per-request.js
import mongoose from "mongoose";
import dns from "node:dns";

try { dns.setDefaultResultOrder?.("ipv4first"); } catch {}

export async function openMongo() {
  const { MONGODB_URI, DB_NAME } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is required");

  // Create an isolated connection for this request
  const conn = await mongoose.createConnection(MONGODB_URI, {
    dbName: DB_NAME,
    maxPoolSize: 5,                 // small pool is fine per request
    serverSelectionTimeoutMS: 5000, // fail fast if Atlas not reachable
    connectTimeoutMS: 10000,
  }).asPromise();

  // convenience close handle
  const close = async () => {
    try { await conn.close(); } catch {}
  };

  return { conn, close };
}


const inflight = (globalThis.__inflight ||= { n: 0, max: 0 });
export function markStart() { inflight.n++; inflight.max = Math.max(inflight.max, inflight.n); }
export function markEnd() { inflight.n = Math.max(0, inflight.n - 1); }
export function getInflight() { return { ...inflight }; }
