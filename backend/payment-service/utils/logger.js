const SERVICE_NAME = "payment-service";

function formatLog(level, msg, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    msg,
    ...meta,
  };
  return JSON.stringify(entry);
}

const logger = {
  info: (msg, meta) => console.log(formatLog("INFO", msg, meta)),
  warn: (msg, meta) => console.warn(formatLog("WARN", msg, meta)),
  error: (msg, meta) => console.error(formatLog("ERROR", msg, meta)),
};

module.exports = logger;
