import mongoose from "mongoose";

const patronSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    description: { type: String, default: null },
    image: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PatronModel = mongoose.model("Patron", patronSchema);
export default PatronModel;
