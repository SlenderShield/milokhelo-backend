/**
 * Database Health Check
 * Provides health check functionality for database
 */

class DatabaseHealthCheck {
  constructor(connection) {
    this.connection = connection;
  }

  async check() {
    try {
      const isHealthy = this.connection.isHealthy();
      const state = this.connection.getConnection().readyState;

      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      return {
        healthy: isHealthy,
        status: stateMap[state] || 'unknown',
        readyState: state,
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        error: error.message,
      };
    }
  }
}

module.exports = DatabaseHealthCheck;
