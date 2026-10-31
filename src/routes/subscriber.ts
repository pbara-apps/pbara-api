import SubscriberController from "@/controller/subscriber";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { sendNewsletterSchema, subscribeSchema } from "@/schema/subscriber";
import express from "express";

const router = express.Router();

// Public
router.post("/public/subscribe", [
  validate(subscribeSchema),
  SubscriberController.subscribePublic,
]);
router.get("/unsubscribe", SubscriberController.unsubscribePage);
router.post("/unsubscribe", SubscriberController.unsubscribeOneClick);

// Newsletter (admins only — this emails every subscriber)
router.post("/newsletter/send", [
  requireAuth,
  requireRole(["super_admin", "admin"]),
  validate(sendNewsletterSchema),
  SubscriberController.sendNewsletter,
]);
router.get("/newsletter", [requireAuth, SubscriberController.getNewsletters]);

// Subscriber management. Bulk route must come before "/:id".
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  SubscriberController.deleteBulk,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  SubscriberController.delete,
]);
router.get("/", [requireAuth, SubscriberController.getAll]);

export default router;
