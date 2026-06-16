const path = require('path');
const winston = require('winston');

const { name: serviceName } = require(path.join(__dirname, '../../../package.json'));
const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, stack, ...meta }) => {
    const extras = Object.fromEntries(
      Object.entries(meta).filter(([, value]) => value !== undefined)
    );
    const metaStr = Object.keys(extras).length ? ` ${JSON.stringify(extras)}` : '';
    const line = `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
    return stack ? `${line}\n${stack}` : line;
  })
);

const logger = winston.createLogger({
  level,
  defaultMeta: { service: serviceName },
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Stream({
      stream: process.stdout,
    }),
  ],
  exitOnError: false,
});

let processHandlersRegistered = false;

function registerProcessHandlers() {
  if (processHandlersRegistered) return;
  processHandlersRegistered = true;

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', {
      error: err.message,
      stack: err.stack,
    });
  });
}

registerProcessHandlers();

function logError(message, err, meta = {}) {
  if (err instanceof Error) {
    logger.error(message, { ...meta, error: err.message, stack: err.stack });
    return;
  }
  logger.error(message, { ...meta, error: String(err) });
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const entry = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    };
    if (req.originalUrl === '/health') {
      logger.debug('HTTP request', entry);
      return;
    }
    if (res.statusCode >= 500) {
      logger.error('HTTP request', entry);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request', entry);
    } else {
      logger.info('HTTP request', entry);
    }
  });
  next();
}

logger.logError = logError;
logger.requestLogger = requestLogger;

module.exports = logger;
