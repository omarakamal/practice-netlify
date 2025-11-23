import { clearAuthCookieHeaders } from "../lib/auth.js";

export async function handler(event) {
  console.log("in logout")
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Method not allowed" }) };

  const headers = clearAuthCookieHeaders();
  return { statusCode: 204, headers, body: "" };
}
