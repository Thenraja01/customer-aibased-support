import mongoose, { Schema } from "mongoose";

/**
 * Invoice — billing record for an organization plan.
 *
 * An invoice is created whenever an organization changes plan (pro-rated /
 * immediate). It is NOT tied to an external payment gateway; the gateway
 * integration is intentionally abstracted behind `payment_method`.
 */
const invoiceSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    invoice_number: {
      type: String,
      unique: true,
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "business", "enterprise"],
      required: true,
    },
    amount_usd: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: 10,
    },
    period_start: { type: Date },
    period_end: { type: Date },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "failed", "void"],
      default: "paid",
      index: true,
    },
    payment_method: {
      type: String,
      default: "manual",
      maxlength: 50,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: { type: String, maxlength: 500, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

invoiceSchema.index({ organization_id: 1, created_at: -1 });

export default mongoose.model("Invoice", invoiceSchema);