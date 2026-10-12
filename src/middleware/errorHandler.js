import { ZodError } from "zod";
import { AppError } from "../utils/httpErrors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map(e => ({
      field: e.path.join("."),
      message: e.message
    }));
    logger.warn(`Validation failed on ${req.method} ${req.url}:`, { errors: errorDetails });
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors[0]?.message || "Validation failed for request data",
        details: errorDetails
      }
    });
  }

  // Handle Known App Errors
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}] on ${req.method} ${req.url}: ${err.message}`);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle SyntaxError (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logger.warn(`Malformed JSON payload received on ${req.method} ${req.url}`);
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid or malformed JSON payload"
      }
    });
  }

  // Unhandled / Internal Server Errors
  logger.error(`Unhandled error on ${req.method} ${req.url}: ${err.message}`);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred while processing your request"
    }
  });
}
