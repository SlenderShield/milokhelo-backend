/**
 * Database Module
 * Entry point for database infrastructure
 */
const MongoDBConnection = require('./connection');
const DatabaseHealthCheck = require('./healthCheck');

module.exports = {
  MongoDBConnection,
  DatabaseHealthCheck,
};
