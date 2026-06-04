import type { NextFunction, Request, Response } from "express";
import { ZodError, type z } from "zod";

const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: any;
        query?: Record<string, string>;
        params?: Record<string, string>;
      };
      if (validated.body) {
        req.body = validated.body;
      }
      if (validated.query) {
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, validated.query);
      }
      if (validated.params) {
        req.params = validated.params;
      }
      return next();
    } catch (e) {
      if (e instanceof ZodError) {
        const issue = e.issues[0];
        const path = issue?.path.join(".");
        const message = path
          ? `${path}: ${issue.message}`
          : (issue?.message ?? "Validation error");
        return res.status(400).json({
          success: false,
          type: "ZodError",
          message,
        });
      }
      throw e;
    }
  };
};

export default validate;
