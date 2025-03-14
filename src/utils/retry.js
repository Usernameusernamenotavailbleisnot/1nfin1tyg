const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {function} fn - Function to retry
 * @param {object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {function} options.shouldRetry - Function to determine if retry is needed
 * @returns {Promise<*>} - Result of the function
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => true,
    walletAddress = '',
    onRetry = null
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }

      logger.error(`Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`, error, walletAddress);
      
      if (onRetry) {
        onRetry(attempt, delay, error);
      }

      await sleep(delay);
      
      // Exponential backoff with jitter
      delay = Math.min(maxDelay, delay * 2 * (0.9 + Math.random() * 0.2));
    }
  }
}

/**
 * Sleep for a specified time
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  withRetry,
  sleep
};