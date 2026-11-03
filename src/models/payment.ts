import mongoose from "mongoose";

/**
 * Payment — a chapter/church payment towards a Bill, made to the
 * association account and backed by an uploaded proof. Part payments are
 * allowed; each payment is verified (or rejected) by finance separately.
 * A verified payment gets a receipt number.
 */
const paymentSchema = new mongoose.Schema(
  {
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
    amount: { type: Number, required: true, min: 1 },
    paidOn: { type: Date, required: true },
    reference: { type: String, default: null, trim: true },
    proofUrl: { type: String, required: true },
    status: { type: String, required: true, enum: ["pending", "verified", "rejected"], default: "pending" },
    reviewNote: { type: String, default: null },
    /** e.g. RCPT-000042, given on verification. */
    receiptNumber: { type: String, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ bill: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: 1 });

const PaymentModel = mongoose.model("Payment", paymentSchema);
export default PaymentModel;
