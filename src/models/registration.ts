import mongoose from "mongoose";

const registrationEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rank",
      required: true,
    },
    church: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    registrationCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistrationProgram",
      required: true,
    },
    registrantName: { type: String, required: true },
    registrantPhone: { type: String, required: true },
    proofOfPaymentUrl: { type: String, required: true },
    registrationType: {
      type: String,
      required: true,
      enum: ["single", "bulk"],
    },
    entries: {
      type: [registrationEntrySchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length >= 1,
        message: "At least one entry is required",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    adminNote: { type: String, default: null },
  },
  { timestamps: true },
);

registrationSchema.index({ programId: 1, status: 1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index(
  { "entries.registrationCode": 1 },
  { unique: true, sparse: true },
);

const RegistrationModel = mongoose.model("Registration", registrationSchema);

export default RegistrationModel;
