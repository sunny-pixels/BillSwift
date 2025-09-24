// models/bill.model.js
import mongoose from "mongoose";

const BillLineSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, // optional ref
    // snapshot to preserve history even if inventory changes later
    product: { type: String, required: true },
    mrp: { type: Number, required: true },
    quantity: { type: Number, required: true },
    netamt: { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new mongoose.Schema(
  {
    billId: { type: String, index: true },
    customer: {
      phone: String,
    },
    items: { type: [BillLineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "finalized", "canceled"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", BillSchema);
