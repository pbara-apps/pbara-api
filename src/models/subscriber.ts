import crypto from "crypto";
import mongoose from "mongoose";

export const newUnsubscribeToken = () => crypto.randomBytes(24).toString("hex");

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    source: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    unsubscribed_at: { type: Date, default: null },
    unsubscribe_token: {
      type: String,
      default: newUnsubscribeToken,
      index: true,
    },
  },
  { timestamps: true },
);

const SubscriberModel = mongoose.model("Subscriber", subscriberSchema);
export default SubscriberModel;
