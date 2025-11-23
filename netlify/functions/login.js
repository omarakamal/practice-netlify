import bcrypt from "bcryptjs";
import { openMongo } from "../lib/mongo-per-request.js";
import { getUserModel } from "../lib/models/User.js";
import { signAccessToken, setAuthCookieHeaders } from "../lib/auth.js";
import { json } from "../lib/helpers/products.shared.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { message: "Method not allowed" });

  // Parse the Body
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { message: "invalid JSON body" }); }

  // Validate the data from the body
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  if (!email || !password) return json(400, { message: "email and password required" });



  // make connnection with db
  const { conn, close } = await openMongo();
  // get the user model from the connection
  const User = getUserModel(conn);
  try {
    const user = await User.findOne({ email }).exec();      // only admins exist
    if (!user) return json(401, { message: "invalid credentials" });

    // Verify if the password is correct
    const passwordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!passwordCorrect) return json(401, { message: "invalid credentials" });


    const token = signAccessToken({ sub: String(user._id), role: "admin", email: user.email });
    const cookie = setAuthCookieHeaders(token);

    console.log('cookie:',cookie)
    return json(200, { user: { id: user._id, email: user.email, role: "admin" } }, cookie);
  } catch (e) {
    return json(500, { message: "login failed", error: String(e) });
  } finally {
    await close();
  }
}