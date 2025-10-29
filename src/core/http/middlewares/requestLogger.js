/**
 * Request Logger Middleware
 * Logs all HTTP requests with correlation IDs and performance metrics
 */
import crypto from 'crypto';

function requestLogger(logger) {
  return (req, res, next) => {
    // Generate unique request ID for correlation
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const start = Date.now();

    // Create child logger with request context
    req.logger = logger.child({
      requestId,
      method: req.method,
      path: req.path,
    });

    // Log incoming request
    req.logger.http('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      req.logger[level]('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      });
    });

    // Log if request was closed prematurely
    res.on('close', () => {
      if (!res.writableEnded) {
        req.logger.warn('Request closed before response sent', {
          method: req.method,
          url: req.url,
          duration: Date.now() - start,
        });
      }
    });

    next();
  };
}

export default requestLogger;
