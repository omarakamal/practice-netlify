import jwt from "jsonwebtoken";

function cookieName() {
  return process.env.COOKIE_NAME || "access_token";
}

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn });
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

export function getTokenFromEvent(event) {
  console.log('getTokenFromEventCalled', event)
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization;
  console.log(auth)
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);

  const raw = h.cookie || h.Cookie || "";
  console.log('raw: ',raw)
  const name = cookieName() + "=";
  for (const part of raw.split(/;\s*/)) {
    if (part.startsWith(name)) return part.slice(name.length);
  }
  return null;
}

export function setAuthCookieHeaders(token) {
  const attrs = [
    `${cookieName()}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 30}`,
  ];
  if (process.env.COOKIE_DOMAIN) attrs.push(`Domain=${process.env.COOKIE_DOMAIN}`);
  if (process.env.NETLIFY === "true" || process.env.NODE_ENV === "production") attrs.push("Secure");
  console.log(attrs)
  return { "Set-Cookie": attrs.join("; ") };
}

export function clearAuthCookieHeaders() {
  const attrs = [
    `${cookieName()}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (process.env.COOKIE_DOMAIN) attrs.push(`Domain=${process.env.COOKIE_DOMAIN}`);
  if (process.env.NETLIFY === "true" || process.env.NODE_ENV === "production") attrs.push("Secure");
  return { "Set-Cookie": attrs.join("; ") };
}

// Only allow admins (all logged-in users are admins)
export function requireAdmin(event) {
  const token = getTokenFromEvent(event);
  console.log('token',token)
  if (!token) return { ok: false, status: 401, body: { message: "You are not logged in" } };
  try {
    const claims = verifyAccessToken(token);
    if (claims.role !== "admin") return { ok: false, status: 403, body: { message: "admin only" } };
    return { ok: true, claims };
  } catch {
    return { ok: false, status: 401, body: { message: "invalid or expired token" } };
  }
}

