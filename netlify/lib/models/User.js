import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  // We keep role for future flexibility, but only 'admin' exists today.
  role: { type: String, enum: ["admin"], default: "admin" },
}, { timestamps: true });

export function getUserModel(conn) {
  return conn.models.User || conn.model("User", UserSchema);
}
