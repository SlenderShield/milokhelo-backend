/**
 * Development Environment Configuration
 */
export default {
  env: 'development',

  app: {
    name: process.env.APP_NAME || 'milokhelo-backend',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/milokhelo_dev',
    options: {
      // Mongoose 6+ handles these automatically
    },
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'pretty',
    enabled: process.env.LOGGING_ENABLED !== 'false',
  },

  eventBus: {
    adapter: process.env.EVENT_BUS_ADAPTER || 'memory', // 'memory' or 'redis'
  },

  security: {
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000', 10), // 7 days
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET || '',
    oauthCallbackUrl:
      process.env.OAUTH_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/oauth/callback',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },
};
