import mongoose from "mongoose";

const churchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      default: null,
    },
    chapter: {
      type: String,
      required: true,
    },
    counsellor: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const ChurchModel = mongoose.model("Church", churchSchema);

export default ChurchModel;
