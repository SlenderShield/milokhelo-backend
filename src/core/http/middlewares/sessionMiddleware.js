/**
 * Session Middleware Configuration
 * Sets up express-session with Redis store
 */
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';

export function createSessionMiddleware(config, logger) {
  const redisClient = new Redis({
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    password: config.get('redis.password'),
    db: config.get('redis.db'),
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error for session store', { error: err.message });
  });

  redisClient.on('connect', () => {
    logger.info('Redis session store connected');
  });

  const sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'milokhelo:sess:',
  });

  return session({
    store: sessionStore,
    secret: config.get('auth.sessionSecret'),
    resave: false,
    saveUninitialized: false,
    name: 'session',
    cookie: {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax',
      maxAge: config.get('auth.sessionMaxAge'),
    },
  });
}
