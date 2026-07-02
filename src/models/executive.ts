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
    title: {
      type: String,
      required: true,
      default: "Director's Desk",
    },
    description: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["super_admin", "admin", "editor", "viewer"],
      default: "admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

executiveSchema.virtual("church", {
  ref: "Church",
  localField: "church_id",
  foreignField: "_id",
  justOne: true,
});

executiveSchema.virtual("office", {
  ref: "Office",
  localField: "office_id",
  foreignField: "_id",
  justOne: true,
});

const ExecutiveModel = mongoose.model("Executive", executiveSchema);

export default ExecutiveModel;
