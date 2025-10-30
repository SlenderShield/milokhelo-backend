/**
 * Production Environment Configuration
 */
export default {
  env: 'production',

  app: {
    name: process.env.APP_NAME || 'milokhelo-backend',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/milokhelo_prod',
    options: {
      // Mongoose 6+ handles these automatically
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enabled: process.env.LOGGING_ENABLED !== 'false',
  },

  eventBus: {
    adapter: process.env.EVENT_BUS_ADAPTER || 'redis', // Use Redis in production
  },

  security: {
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
    refreshTokenExpiration: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '2592000000', 10), // 30 days in ms
    sessionSecret: process.env.SESSION_SECRET,
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000', 10), // 7 days
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET || '',
    oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL,
    frontendUrl: process.env.FRONTEND_URL,
  },

  email: {
    from: process.env.EMAIL_FROM || 'noreply@milokhelo.com',
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'console', 'sendgrid', 'ses'
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },

  pushNotifications: {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    fcm: {
      enabled: process.env.FCM_ENABLED === 'true',
      projectId: process.env.FCM_PROJECT_ID || '',
      clientEmail: process.env.FCM_CLIENT_EMAIL || '',
      privateKey: process.env.FCM_PRIVATE_KEY || '',
      serviceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || '',
    },
    apns: {
      enabled: process.env.APNS_ENABLED === 'true',
      keyId: process.env.APNS_KEY_ID || '',
      teamId: process.env.APNS_TEAM_ID || '',
      bundleId: process.env.APNS_BUNDLE_ID || '',
      keyPath: process.env.APNS_KEY_PATH || '',
      production: process.env.APNS_PRODUCTION === 'true',
    },
  },

  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },
};
