import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender_type: {
      type: String,
      enum: ["user", "ai", "admin"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

messageSchema.index({
  chat_id: 1,
  created_at: 1,
});

export default mongoose.model("Message", messageSchema);