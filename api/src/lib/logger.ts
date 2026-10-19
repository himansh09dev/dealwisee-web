import { pino, type Logger } from "pino";

/**
 * JSON logs (CloudWatch-friendly). Credentials can't leak through logs:
 * cookies and auth headers are redacted, and request bodies are never logged.
 */
export function createLogger(level: string): Logger {
  return pino({
    level,
    redact: {
      paths: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
      censor: "[redacted]",
    },
  });
}
