// netlify/lib/models/productModel.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  description: { type: String, default: "" },
  imageUrl:    { type: String, default: "" },
});

// Optional full-text search
ProductSchema.index({ name: "text", description: "text" });

export function getProductModel(conn) {
  // Avoid OverwriteModelError if this connection already compiled it
  return conn.models.Product || conn.model("Product", ProductSchema);
}
