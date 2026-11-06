import mongoose from "mongoose";

/**
 * Due — a charge the association sets for chapters or churches to pay.
 *
 * - type: "due" (recurring, e.g. annual chapter dues) or "levy" (one-off).
 * - billTo: finance chooses whether each CHAPTER or each CHURCH is billed.
 * - chargeBasis: a flat amount per bill, or amount × active members
 *   (member count is fixed when the bill is created).
 * - appliesTo: everyone, or selected churches/chapters.
 *
 * Creating a due immediately creates one Bill per target.
 */
const dueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    type: { type: String, required: true, enum: ["due", "levy"] },
    billTo: { type: String, required: true, enum: ["chapter", "church"] },
    chargeBasis: { type: String, required: true, enum: ["flat", "per_member"] },
    /** Naira: the flat amount, or the amount per member. */
    amount: { type: Number, required: true, min: 1 },
    /** Free label for the period covered, e.g. "2027". */
    period: { type: String, default: null, trim: true },
    dueDate: { type: Date, required: true },
    appliesTo: { type: String, required: true, enum: ["all", "selected"] },
    targetChurches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Church" }],
    targetChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  },
  { timestamps: true },
);

dueSchema.index({ createdAt: -1 });

const DueModel = mongoose.model("Due", dueSchema);
export default DueModel;
