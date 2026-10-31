import { getAuthUser } from "@/helpers/auth-user";
import { unsubscribePage } from "@/helpers/email-templates";
import SubscriberService from "@/service/subscriber";
import { NextFunction, Request, Response } from "express";

const tokenFrom = (req: Request) =>
  String(req.query.token ?? req.body?.token ?? "").trim();

const SubscriberController = {
  async subscribePublic(req: Request, res: Response, next: NextFunction) {
    try {
      await SubscriberService.subscribe(req.body.email, req.body.source);
      // Don't echo subscriber data back to the public.
      return res.status(201).json({
        message: "You're subscribed! We'll keep you posted.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
  // GET: link in the email footer → shows a confirmation page.
  async unsubscribePage(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriberService.unsubscribe(tokenFrom(req));
      return res
        .status(sub ? 200 : 404)
        .type("html")
        .send(unsubscribePage(Boolean(sub)));
    } catch (error) {
      next(error);
    }
  },
  // POST: one-click unsubscribe from Gmail/Outlook (List-Unsubscribe-Post).
  async unsubscribeOneClick(req: Request, res: Response, next: NextFunction) {
    try {
      await SubscriberService.unsubscribe(tokenFrom(req));
      return res.status(200).json({ message: "Unsubscribed", data: null });
    } catch (error) {
      next(error);
    }
  },
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const subscribers = await SubscriberService.getAll();
      return res.status(200).json({
        message: "Subscribers fetched successfully",
        data: subscribers,
      });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SubscriberService.delete(req.params.id as string);
      return res.status(200).json({
        message: "Subscriber removed successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriberService.deleteMany(req.body.ids);
      return res.status(200).json({
        message: "Subscribers removed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  async sendNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, content, test_email } = req.body;
      if (test_email) {
        const data = await SubscriberService.sendTestNewsletter({
          subject,
          content,
          to: test_email,
        });
        return res.status(200).json({
          message: `Test email sent to ${test_email}`,
          data,
        });
      }
      const actor = getAuthUser(req);
      const record = await SubscriberService.sendNewsletter(
        { subject, content },
        actor ? { id: actor.id, name: actor.name } : undefined,
      );
      const msg =
        record?.status === "sent"
          ? `Newsletter sent to ${record.sent_count} subscribers`
          : `Newsletter sent to ${record?.sent_count ?? 0} of ${record?.recipient_count ?? 0} subscribers (${record?.failed_count ?? 0} failed)`;
      return res.status(200).json({ message: msg, data: record });
    } catch (error) {
      next(error);
    }
  },
  async getNewsletters(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriberService.getNewsletters();
      return res.status(200).json({ message: "Newsletters fetched", data });
    } catch (error) {
      next(error);
    }
  },
};

export default SubscriberController;
