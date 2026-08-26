import mongoose, { Schema } from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender_type: {
      type: String,
      enum: ["CUSTOMER", "SUPPORT", "BRANCH_ADMIN", "ADMIN", "SUPER_ADMIN", "SYSTEM"],
      default: "CUSTOMER",
    },
    content: { type: String, required: true },
    attachments: [
      {
        file_name: String,
        file_url: String,
        file_type: String,
        file_size: Number,
      },
    ],
    is_internal: {
      type: Boolean,
      default: false,
    },
    // Delivery lifecycle: sent → delivered → read.
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    delivered_at: { type: Date, default: null },
    read_at: { type: Date, default: null },
    read_by: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

ticketMessageSchema.index({ ticket_id: 1, created_at: 1 });

export default mongoose.model("TicketMessage", ticketMessageSchema);
