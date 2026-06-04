import mongoose from "mongoose";

const executiveSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    office_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      required: true,
    },
    church_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    start_year: {
      type: Number,
      required: true,
    },
    end_year: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "completed"],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

const ExecutiveModel = mongoose.model("Executive", executiveSchema);

export default ExecutiveModel;
