import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so any thrown error goes to the error
 * handler, instead of repeating try/catch in every controller method.
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}
