import { getActor } from "@/helpers/request-actor";
import EventService from "@/service/event";
import { NextFunction, Request, Response } from "express";

const EventController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.create(req.body, getActor(req));
      return res
        .status(201)
        .json({ message: "Event created successfully", data: event });
    } catch (error) {
      next(error);
    }
  },
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await EventService.getAll();
      return res
        .status(200)
        .json({ message: "Events fetched successfully", data: events });
    } catch (error) {
      next(error);
    }
  },
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await EventService.getPublic();
      return res
        .status(200)
        .json({ message: "Public events fetched successfully", data: events });
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.update(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res
        .status(200)
        .json({ message: "Event updated successfully", data: event });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await EventService.delete(req.params.id as string, getActor(req));
      return res
        .status(200)
        .json({ message: "Event deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      await EventService.deleteMany(req.body.ids, getActor(req));
      return res.status(200).json({
        message: "Events deleted successfully",
        data: { deletedCount: req.body.ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default EventController;
