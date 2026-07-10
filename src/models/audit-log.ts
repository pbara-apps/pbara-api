import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["created", "updated", "deleted"],
    },
    entity_type: {
      type: String,
      required: true,
      enum: ["news", "event", "gallery", "executive", "chapter", "office", "patron"],
    },
    entity_id: { type: String, default: null },
    entity_title: { type: String, required: true },
    actor_id: { type: String, default: null },
    actor_name: { type: String, default: "System" },
    detail: { type: String, default: null },
  },
  { timestamps: true },
);

const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
export default AuditLogModel;
