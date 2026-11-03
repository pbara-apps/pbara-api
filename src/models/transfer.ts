import mongoose from "mongoose";

/**
 * Transfer — moving an approved member to another chapter (same or a
 * different church). Requested by an officer of the member's current
 * chapter; approved by a super_admin. The member keeps their ID and history.
 */
const transferSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador", required: true },
    fromChapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    toChapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    reason: { type: String, default: null, trim: true },
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewNote: { type: String, default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

transferSchema.index({ status: 1, createdAt: 1 });
transferSchema.index({ member: 1, status: 1 });

const TransferModel = mongoose.model("Transfer", transferSchema);
export default TransferModel;
