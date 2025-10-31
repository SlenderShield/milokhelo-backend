/**
 * Metrics Middleware
 * Collects HTTP request metrics for Prometheus
 */

function metricsMiddleware(metricsCollector) {
  let activeConnections = 0;

  return (req, res, next) => {
    const start = process.hrtime.bigint();

    // Track active connections using local counter
    activeConnections++;
    metricsCollector.setActiveConnections(activeConnections);

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationSeconds = Number(end - start) / 1e9;

      // Get route pattern or path
      const route = req.route ? req.route.path : req.path;

      // Record metrics
      metricsCollector.recordHttpRequest(
        req.method,
        route,
        res.statusCode.toString(),
        durationSeconds
      );

      // Decrement active connections
      activeConnections--;
      metricsCollector.setActiveConnections(activeConnections);
    });

    next();
  };
}

export default metricsMiddleware;
