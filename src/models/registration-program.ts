import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
  },
  { _id: false },
);

const registrationProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, default: null },
    flyerImageUrl: { type: String, default: null },
    amount: { type: Number, required: true },
    bankDetails: { type: bankDetailsSchema, required: true },
    registrationMode: {
      type: String,
      required: true,
      enum: ["single", "bulk", "both"],
    },
    registrationDeadline: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    termsAndConditions: { type: String, default: null },
  },
  { timestamps: true },
);

const RegistrationProgramModel = mongoose.model(
  "RegistrationProgram",
  registrationProgramSchema,
);

export default RegistrationProgramModel;
