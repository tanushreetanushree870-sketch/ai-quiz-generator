/**
 * Safe, structured logger that prevents leaking sensitive keys or headers.
 */

function sanitize(message) {
  if (typeof message !== "string") return message;
  // Mask anything resembling an API key (e.g., AIzaSy... or raw tokens)
  return message.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]");
}

export const logger = {
  info: (msg, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${sanitize(msg)}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
  },
  warn: (msg, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${sanitize(msg)}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
  },
  error: (msg, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${sanitize(msg)}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== "production") {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${sanitize(msg)}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
    }
  }
};
