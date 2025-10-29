/**
 * Security Middleware
 * Configures security headers, CORS, and rate limiting
 */
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * Configure Helmet for security headers
 */
function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
}

/**
 * Configure CORS
 */
function configureCORS(config) {
  const corsOptions = {
    origin: config.get('security.corsOrigins') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions);
}

/**
 * Configure rate limiting
 */
function configureRateLimit(config) {
  const windowMs = config.get('security.rateLimitWindowMs') || 15 * 60 * 1000; // 15 minutes
  const max = config.get('security.rateLimitMax') || 100; // limit each IP to 100 requests per windowMs

  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/health/ready';
    },
  });
}

/**
 * Configure stricter rate limiting for auth endpoints
 */
function configureAuthRateLimit(config) {
  const windowMs = config.get('security.authRateLimitWindowMs') || 15 * 60 * 1000; // 15 minutes
  const max = config.get('security.authRateLimitMax') || 5; // limit each IP to 5 requests per windowMs

  return rateLimit({
    windowMs,
    max,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export { configureHelmet, configureCORS, configureRateLimit, configureAuthRateLimit };
