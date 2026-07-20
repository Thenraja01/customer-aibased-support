import mongoose, { Schema } from "mongoose";

const ticketCommentSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    comment: { type: String, required: true, maxlength: 2000 },
    is_internal: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

ticketCommentSchema.index({ ticket_id: 1, created_at: -1 });

export default mongoose.model("TicketComment", ticketCommentSchema);
