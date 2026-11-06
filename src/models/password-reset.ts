import mongoose from "mongoose";

/**
 * PasswordReset — a one-time "forgot password" link for an account (admin
 * or chapter leader). Only a SHA-256 hash of the token is stored, so a leaked
 * database can't be used to reset passwords. MongoDB deletes expired
 * records automatically (TTL index on expiresAt).
 */
const passwordResetSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetSchema.index({ account: 1 });

const PasswordResetModel = mongoose.model("PasswordReset", passwordResetSchema);
export default PasswordResetModel;
