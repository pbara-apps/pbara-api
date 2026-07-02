import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    read_at: { type: Date, default: null },
    read_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Executive",
      default: null,
    },
  },
  { timestamps: true },
);

const MessageModel = mongoose.model("Message", messageSchema);
export default MessageModel;
