import mongoose from "mongoose";

/**
 * Counter — a named, ever-increasing number (e.g. "member-id").
 * Incremented atomically, so two approvals at the same moment can
 * never get the same number.
 */
const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const CounterModel = mongoose.model("Counter", counterSchema);

export default CounterModel;
