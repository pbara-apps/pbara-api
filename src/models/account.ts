import mongoose from "mongoose";

/**
 * Account — one login per person (one email, one password).
 *
 * An account can hold:
 * - admin access: the association admin portal, with a role. It may be
 *   linked to an Executive profile; only linked accounts can be finance
 *   officers (Financial Secretary / Treasurer).
 * - chapter access: the chapter portal, as a church Counsellor or a
 *   chapter President / Secretary.
 * - a link to the person's member record (Ambassador), when they have one.
 *
 * Executives are public profiles only; having an executive profile does not
 * give anyone a login.
 *
 * New accounts start with a one-time password sent by email and
 * `has_changed_password: false`. Both portals block everything except
 * "change password" until the person sets their own password.
 */
export const ADMIN_ROLES = ["super_admin", "admin", "editor", "finance", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const CHAPTER_ROLES = ["counsellor", "president", "secretary"] as const;
export type ChapterRole = (typeof CHAPTER_ROLES)[number];

const adminAccessSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ADMIN_ROLES, default: "viewer" },
    /** The executive profile this login belongs to, if any. */
    executive: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
    /** Financial Secretary / Treasurer. Only allowed when `executive` is set. */
    is_finance: { type: Boolean, default: false },
    /** False when admin access was removed. The rest of the account still works. */
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const chapterAccessSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: CHAPTER_ROLES },
    church: { type: mongoose.Schema.Types.ObjectId, ref: "Church", required: true },
    /** Set for president/secretary; null for the counsellor (church-wide). */
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", default: null },
    /** False when the person was replaced or removed from the position. */
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const accountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    password: { type: String, required: true, select: false },
    /**
     * Older password hashes that still work until the first password change.
     * Only used for people who had two separate logins before accounts were merged.
     */
    legacy_passwords: { type: [String], default: [], select: false },
    has_changed_password: { type: Boolean, default: false },
    /** False blocks every kind of access for this person. */
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },

    admin: { type: adminAccessSchema, default: null },
    chapterAccess: { type: chapterAccessSchema, default: null },
    /** The person's member record (ambassador or counsellor). */
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador", default: null },

    /**
     * Earlier ids of this person from before accounts were merged. Old records
     * (e.g. notifications) that point at these ids still belong to this account.
     */
    aliases: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    /**
     * Set for accounts moved over from the old separate logins
     * (scripts/migrate-accounts.ts). Used to send the one-off restructure email.
     */
    migration: {
      type: new mongoose.Schema(
        {
          migratedAt: { type: Date, required: true },
          /** True when an admin login and a chapter login were merged. */
          merged: { type: Boolean, default: false },
          emailSentAt: { type: Date, default: null },
        },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

/**
 * The person's role for display where an account is shown as "who did this"
 * (e.g. "Ada (president)"): chapter role first, otherwise admin role.
 */
accountSchema.virtual("role").get(function () {
  return this.chapterAccess?.role ?? this.admin?.role ?? null;
});

/** Populate selection that keeps `role` working on populated accounts. */
export const ACTOR_SELECT = "name chapterAccess.role admin.role";

accountSchema.index({ "admin.role": 1, "admin.active": 1 });
accountSchema.index({ "admin.executive": 1 });
accountSchema.index({ "chapterAccess.church": 1, "chapterAccess.role": 1, "chapterAccess.active": 1 });
accountSchema.index({ "chapterAccess.chapter": 1, "chapterAccess.role": 1, "chapterAccess.active": 1 });
accountSchema.index({ aliases: 1 });

const AccountModel = mongoose.model("Account", accountSchema);

export type AccountDoc = mongoose.HydratedDocument<mongoose.InferSchemaType<typeof accountSchema>>;

export default AccountModel;
