import mongoose from "mongoose";

const registrationCounterSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistrationProgram",
      required: true,
      unique: true,
    },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const RegistrationCounterModel = mongoose.model(
  "RegistrationCounter",
  registrationCounterSchema,
);

export default RegistrationCounterModel;
