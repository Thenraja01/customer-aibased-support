import mongoose, { Schema } from "mongoose";

const aiSessionSchema = new Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    model_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    tokens_used: {
      type: Number,
      required: true,
      min: 0,
    },
    response_time: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.model("AISession", aiSessionSchema);
