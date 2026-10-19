import type { ApiErrorBody, ErrorCode, FieldIssue } from "@pricepilot/contracts";
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import type { Logger } from "pino";
import { ZodError } from "zod";

import { HttpError } from "../lib/http-error.ts";

function send(res: Response, status: number, code: ErrorCode, message: string, details?: FieldIssue[]) {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
  res.status(status).json(body);
}

const hasProp = <K extends string>(value: unknown, key: K): value is Record<K, unknown> =>
  typeof value === "object" && value !== null && key in value;

/**
 * Turns every error into the standard envelope. Clients get a stable code
 * and a safe message; stack traces, query details and driver messages stay
 * in the server log.
 */
export function errorHandler(logger: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return send(res, err.status, err.code, err.message, err.details);

    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return send(res, 400, "VALIDATION_ERROR", "Some fields are invalid", details);
    }

    // body-parser errors
    if (hasProp(err, "type")) {
      if (err.type === "entity.parse.failed") return send(res, 400, "MALFORMED_REQUEST", "Malformed JSON body");
      if (err.type === "entity.too.large") return send(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large");
    }

    if (err instanceof mongoose.Error.CastError) return send(res, 400, "MALFORMED_REQUEST", "Invalid identifier");

    if (err instanceof mongoose.Error.ValidationError) {
      const details = Object.entries(err.errors).map(([path, e]) => ({ path, message: e.message }));
      return send(res, 400, "VALIDATION_ERROR", "Some fields are invalid", details);
    }

    if (hasProp(err, "code") && err.code === 11000) {
      const field = hasProp(err, "keyPattern") && err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
      const message = field ? `That ${field} is already in use` : "That value is already in use";
      return send(res, 409, "CONFLICT", message, field ? [{ path: field, message }] : undefined);
    }

    if (
      err instanceof mongoose.Error.MongooseServerSelectionError ||
      (err instanceof Error && err.name === "MongoNotConnectedError")
    ) {
      logger.error({ err, path: req.path }, "database unavailable");
      return send(res, 503, "SERVICE_UNAVAILABLE", "The service is temporarily unavailable");
    }

    logger.error({ err, method: req.method, path: req.path }, "unhandled error");
    return send(res, 500, "INTERNAL_ERROR", "Something went wrong");
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  send(res, 404, "NOT_FOUND", "No such endpoint");
}
