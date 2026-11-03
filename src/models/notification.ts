import mongoose from "mongoose";

/**
 * Notification — an in-app message for one person, shown in the bell menu
 * of the admin portal or the chapter portal.
 *
 * `recipientType` says which kind of account `recipient` points to:
 * an association admin (Executive) or a chapter portal user (PortalUser).
 */
export const RECIPIENT_TYPES = ["executive", "portal_user"] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];

const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, required: true, enum: RECIPIENT_TYPES },
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
    /** Short machine name, e.g. "members.submitted", for icons/filtering. */
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    /** Page to open when clicked, e.g. "/admin/recruitment". */
    link: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientType: 1, recipient: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, recipient: 1, readAt: 1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);

export default NotificationModel;
