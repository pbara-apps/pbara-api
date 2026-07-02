import { getAuthUser } from "@/helpers/auth-user";
import MessageService from "@/service/message";
import { NextFunction, Request, Response } from "express";

const MessageController = {
  async createPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await MessageService.create(req.body);
      return res.status(201).json({
        message: "Your message has been sent successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await MessageService.getAll();
      return res.status(200).json({
        message: "Messages fetched successfully",
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await MessageService.getUnreadCount();
      return res.status(200).json({
        message: "Unread count fetched successfully",
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getAuthUser(req);
      const message = await MessageService.markRead(
        req.params.id as string,
        actor?.id,
      );
      return res.status(200).json({
        message: "Message marked as read",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },
  async markManyRead(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getAuthUser(req);
      const result = await MessageService.markManyRead(
        req.body.ids,
        actor?.id,
      );
      return res.status(200).json({
        message: "Messages marked as read",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await MessageService.delete(req.params.id as string);
      return res.status(200).json({
        message: "Message deleted successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.deleteMany(req.body.ids);
      return res.status(200).json({
        message: "Messages deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default MessageController;
