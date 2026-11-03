/** Error with an HTTP status. The global error handler sends `message` for statuses below 500. */
export type HttpError = Error & { status?: number; code?: string };

export function httpError(status: number, message: string, code?: string): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  if (code) err.code = code;
  return err;
}
