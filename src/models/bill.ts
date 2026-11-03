import mongoose from "mongoose";

/**
 * Bill — what one chapter (or church) owes for one Due.
 *
 * `amountPaid` only counts VERIFIED payments. The bill's status is worked
 * out when read (see finance helpers): waived, paid, part paid, awaiting
 * verification, overdue or unpaid.
 */
const billSchema = new mongoose.Schema(
  {
    due: { type: mongoose.Schema.Types.ObjectId, ref: "Due", required: true },
    billTo: { type: String, required: true, enum: ["chapter", "church"] },
    church: { type: mongoose.Schema.Types.ObjectId, ref: "Church", required: true },
    /** Set when billTo is "chapter". */
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", default: null },
    /** Active members counted when the bill was created (per-member dues only). */
    memberCount: { type: Number, default: null },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    waived: { type: Boolean, default: false },
    /** Reason for a waiver or a manual change of the amount. */
    adjustmentNote: { type: String, default: null },
  },
  { timestamps: true },
);

billSchema.index({ due: 1 });
billSchema.index({ chapter: 1, createdAt: -1 });
billSchema.index({ church: 1, createdAt: -1 });

const BillModel = mongoose.model("Bill", billSchema);
export default BillModel;
