/**
 * Utility Functions
 * Common helper functions used across the application
 */

/**
 * Async error handler wrapper for Express routes
 * @param {Function} fn - Async function to wrap
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 */
function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Pick specific keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 */
function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

/**
 * Omit specific keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 */
function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

module.exports = {
  asyncHandler,
  delay,
  isEmpty,
  deepClone,
  pick,
  omit,
  retry,
};
