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
      // Frontend posts finalized bills from BillPage; default to finalized
      default: "finalized",
    },
  },
  { timestamps: true }
);

// Ensure monetary fields are computed if not supplied explicitly
BillSchema.pre("save", function (next) {
  // Compute subtotal from items.netamt when not provided or zero
  if (!this.subtotal || this.subtotal === 0) {
    this.subtotal = (this.items || []).reduce(
      (sum, item) => sum + (Number(item?.netamt) || 0),
      0
    );
  }
  // Normalize discount
  this.discount = Number(this.discount) || 0;
  // Compute total
  this.total = Number(this.subtotal) - Number(this.discount);
  next();
});

export default mongoose.model("Bill", BillSchema);
