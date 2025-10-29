/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass them to error handling middleware
 * Eliminates the need for try-catch blocks in every async controller method
 * 
 * @module core/http/middlewares/asyncHandler
 * 
 * @example
 * import { asyncHandler } from './core/http/middlewares/asyncHandler.js';
 * 
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 */

/**
 * Wraps an async function to automatically catch errors
 * @param {Function} fn - Async function to wrap (typically an Express route handler)
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
export { asyncHandler };
