import mongoose from "mongoose";

/**
 * AssociationSettings — one document (key "association") holding
 * association-wide settings.
 *
 * `paymentAccount` is the single bank account all payments go to:
 * program registrations now, chapter dues and levies later. It is shown
 * wherever someone needs to pay, so programs no longer store their own.
 */
const paymentAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const associationSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "association" },
    paymentAccount: { type: paymentAccountSchema, default: null },
  },
  { timestamps: true },
);

const AssociationSettingsModel = mongoose.model("AssociationSettings", associationSettingsSchema);

export default AssociationSettingsModel;
