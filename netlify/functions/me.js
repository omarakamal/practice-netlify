import { json } from "../lib/helpers/products.shared.js";
import { getTokenFromEvent, verifyAccessToken } from "../lib/auth.js";
import { openMongo } from "../lib/mongo-per-request.js";
import { getUserModel } from "../lib/models/User.js";

export async function handler(event) {
  // console.log('event',event)
  const token = getTokenFromEvent(event);
  console.log(token)
  if (!token) return json(401, { message: "missing token" });
  try {
    // verify token to get claims
    const claims = verifyAccessToken(token);

    // optional: fetch fresh user record from DB for extra info (roles, etc.)
    const { conn, close } = await openMongo();
    try {
      const User = getUserModel(conn);
      const user = await User.findById(claims.sub).lean().exec();
      if (!user) return json(401, { message: "user not found" });

      // Shape the returned object to what frontend expects
      return json(200, { user: { id: String(user._id), email: user.email, role: claims.role || user.role } });
    } finally {
      await close();
    }

  } catch (err) {
    return json(401, { message: "invalid or expired token" });
  }
}