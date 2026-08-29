import mongoose, { Schema } from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Counter = mongoose.model("Counter", counterSchema);

export const getNextSequence = async (key) => {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc.sequence;
};

export default Counter;