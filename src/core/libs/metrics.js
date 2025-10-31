/**
 * Metrics Collection with Prometheus
 * Provides application metrics for monitoring
 * 
 * Metrics:
 * - HTTP request duration histogram
 * - HTTP request counter
 * - Active connections gauge
 * - Event bus events counter
 * - Database query duration
 * - Process metrics (CPU, memory, uptime)
 */

import promClient from 'prom-client';

class MetricsCollector {
  constructor(config = {}) {
    this.register = new promClient.Registry();
    
    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: config.prefix || 'milokhelo_',
    });

    // HTTP Metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpActiveConnections = new promClient.Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
      registers: [this.register],
    });

    // Event Bus Metrics
    this.eventBusEventsTotal = new promClient.Counter({
      name: 'eventbus_events_total',
      help: 'Total number of events published',
      labelNames: ['event_name', 'status'],
      registers: [this.register],
    });

    this.eventBusHandlerDuration = new promClient.Histogram({
      name: 'eventbus_handler_duration_seconds',
      help: 'Duration of event handler execution',
      labelNames: ['event_name', 'handler'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    // Database Metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'collection'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.dbConnectionsActive = new promClient.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    // Redis Metrics
    this.redisCommandDuration = new promClient.Histogram({
      name: 'redis_command_duration_seconds',
      help: 'Duration of Redis commands',
      labelNames: ['command'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1],
      registers: [this.register],
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method, route, statusCode, duration) {
    this.httpRequestDuration.labels(method, route, statusCode).observe(duration);
    this.httpRequestTotal.labels(method, route, statusCode).inc();
  }

  /**
   * Set active HTTP connections
   */
  setActiveConnections(count) {
    this.httpActiveConnections.set(count);
  }

  /**
   * Record event bus event
   */
  recordEvent(eventName, status = 'success') {
    this.eventBusEventsTotal.labels(eventName, status).inc();
  }

  /**
   * Record event handler duration
   */
  recordEventHandler(eventName, handler, duration) {
    this.eventBusHandlerDuration.labels(eventName, handler).observe(duration);
  }

  /**
   * Record database query
   */
  recordDbQuery(operation, collection, duration) {
    this.dbQueryDuration.labels(operation, collection).observe(duration);
  }

  /**
   * Set active database connections
   */
  setDbConnections(count) {
    this.dbConnectionsActive.set(count);
  }

  /**
   * Record Redis command
   */
  recordRedisCommand(command, duration) {
    this.redisCommandDuration.labels(command).observe(duration);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics() {
    return this.register.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJson() {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.register.resetMetrics();
  }
}

export default MetricsCollector;
