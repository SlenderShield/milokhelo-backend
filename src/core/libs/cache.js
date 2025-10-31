/**
 * Cache Abstraction Layer
 * Provides unified caching API with Redis backend
 * 
 * Features:
 * - get/set/delete operations with TTL support
 * - Pattern-based invalidation
 * - Namespace support for module-level caching
 * - Cache statistics
 */

class CacheManager {
  constructor(redisClient, logger, options = {}) {
    this.redis = redisClient;
    this.logger = logger;
    this.namespace = options.namespace || 'cache';
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Build cache key with namespace
   */
  _buildKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const fullKey = this._buildKey(key);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        this.logger.debug('Cache miss', { key, namespace: this.namespace });
        return null;
      }

      this.stats.hits++;
      this.logger.debug('Cache hit', { key, namespace: this.namespace });
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      this.logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = null) {
    try {
      const fullKey = this._buildKey(key);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;

      await this.redis.setEx(fullKey, expiry, serialized);
      
      this.stats.sets++;
      this.logger.debug('Cache set', { key, namespace: this.namespace, ttl: expiry });
      
      return true;
    } catch (error) {
      this.logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      const fullKey = this._buildKey(key);
      const deleted = await this.redis.del(fullKey);
      
      this.stats.deletes++;
      this.logger.debug('Cache delete', { key, namespace: this.namespace, deleted });
      
      return deleted > 0;
    } catch (error) {
      this.logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async has(key) {
    try {
      const fullKey = this._buildKey(key);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern) {
    try {
      const fullPattern = this._buildKey(pattern);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        this.logger.debug('No keys to invalidate', { pattern, namespace: this.namespace });
        return 0;
      }

      const deleted = await this.redis.del(keys);
      
      this.stats.deletes += deleted;
      this.logger.info('Cache invalidated', {
        pattern,
        namespace: this.namespace,
        count: deleted,
      });
      
      return deleted;
    } catch (error) {
      this.logger.error('Cache invalidate error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet(key, factory, ttl = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss, fetch from source
    try {
      const value = await factory();
      
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      this.logger.error('Cache getOrSet factory error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, amount = 1) {
    try {
      const fullKey = this._buildKey(key);
      const value = await this.redis.incrBy(fullKey, amount);
      return value;
    } catch (error) {
      this.logger.error('Cache increment error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key, amount = 1) {
    try {
      const fullKey = this._buildKey(key);
      const value = await this.redis.decrBy(fullKey, amount);
      return value;
    } catch (error) {
      this.logger.error('Cache decrement error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Clear all cache in namespace
   */
  async clear() {
    return this.invalidate('*');
  }
}

export default CacheManager;
