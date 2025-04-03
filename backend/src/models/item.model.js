import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  mrp: { type: Number, required: true },
  netamt: { type: Number, required: true },
});

const Item = mongoose.model("items", itemSchema);
export default Item
