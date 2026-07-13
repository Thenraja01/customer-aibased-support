import mongoose, { Schema } from 'mongoose';

const chatSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: String,
    status: {
      type: String,
      default: 'open',
    },
    closed_at: Date,
  },
  {
    timestamps: {
      createdAt: 'created_At',
      updatedAt: false,
    },
  }
);

export default mongoose.model('Chat', chatSchema);