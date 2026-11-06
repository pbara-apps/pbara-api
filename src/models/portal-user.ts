import mongoose from "mongoose";

/**
 * LEGACY — chapter portal logins before the shared Account model.
 * Only the account migration script reads this collection now; live code
 * uses Account.chapterAccess (see dao/portal-user.ts).
 *
 * PortalUser — a login for the chapter portal (separate from Executive,
 * which is the association admin login).
 *
 * Roles and what they can see:
 * - counsellor: one per church; sees every chapter in the church and
 *   creates the President/Secretary logins. Assigned by the association admin.
 * - president / secretary: one each per chapter; see only their own chapter.
 *   Created by the church counsellor.
 *
 * Accounts start with a one-time password sent by email and
 * `has_changed_password: false`. The portal blocks everything except
 * "change password" until the user sets their own password.
 */
export { CHAPTER_ROLES as PORTAL_ROLES, type ChapterRole as PortalRole } from "@/models/account";
import { CHAPTER_ROLES as PORTAL_ROLES } from "@/models/account";

const portalUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: PORTAL_ROLES },
    church: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    /** Set for president/secretary; null for the counsellor (church-wide). */
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      default: null,
    },
    has_changed_password: { type: Boolean, default: false },
    /** False when the person has been replaced or removed. They can no longer log in. */
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

portalUserSchema.index({ church: 1, role: 1, isActive: 1 });
portalUserSchema.index({ chapter: 1, role: 1, isActive: 1 });

const PortalUserModel = mongoose.model("PortalUser", portalUserSchema);

export default PortalUserModel;
