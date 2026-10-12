import crypto from "crypto";
import { logger } from "../utils/logger.js";

export function requestIdMiddleware(req, res, next) {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);

  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl || req.url} [${res.statusCode}] - ${duration}ms (ReqId: ${reqId})`);
  });

  next();
}
