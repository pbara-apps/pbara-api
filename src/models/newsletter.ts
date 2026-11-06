import mongoose from "mongoose";

// One record per newsletter sent from the portal.
const newsletterSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["sending", "sent", "partial", "failed"],
      default: "sending",
    },
    recipient_count: { type: Number, default: 0 },
    sent_count: { type: Number, default: 0 },
    failed_count: { type: Number, default: 0 },
    sent_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    sent_by_name: { type: String, default: null },
  },
  { timestamps: true },
);

const NewsletterModel = mongoose.model("Newsletter", newsletterSchema);
export default NewsletterModel;
