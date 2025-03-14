const figlet = require('figlet');
const config = require('./config/config');
const logger = require('./utils/logger');
const { sleep } = require('./utils/retry');
const ApiService = require('./core/api');
const fs = require('fs-extra');

// Ensure logs directory exists
fs.ensureDirSync('logs');

// Display ASCII art header
function displayHeader() {
  console.log('\n');
  console.log(figlet.textSync('infinityg', { font: 'ANSI Shadow' }));
  console.log('\n');
}

// Main function
async function main() {
  displayHeader();

  // Get credentials (private keys and proxies)
  const credentials = config.getCredentials();
  if (credentials.length === 0) {
    logger.error('No credentials found. Please add private keys to pk.txt');
    process.exit(1);
  }

  logger.info(`Starting with ${credentials.length} accounts`);
  logger.info(`Proxy enabled: ${config.config.enableProxy}`);
  logger.info(`Check-in enabled: ${config.config.enableCheckIn}`);
  logger.info(`Tasks enabled: ${config.config.enableTask}`);

  while (true) {
    // Process each account
    for (let i = 0; i < credentials.length; i++) {
      const { privateKey, proxy } = credentials[i];
      
      const apiService = new ApiService(privateKey, proxy);
      logger.info(`Processing account ${i + 1}/${credentials.length}`, apiService.walletAddress);
      
      try {
        await apiService.processAllTasks();
      } catch (error) {
        logger.error('Error processing account', error, apiService.walletAddress);
      }
      
      // Add delay between accounts
      if (i < credentials.length - 1) {
        logger.info(`Waiting ${config.config.taskDelay}ms before next account...`);
        await sleep(config.config.taskDelay);
      }
    }
    
    // Add 25-hour delay before next run
    logger.info(`All accounts processed. Waiting ${config.config.dailyDelay / (60 * 60 * 1000)} hours before next run...`);
    await sleep(config.config.dailyDelay);
  }
}

// Run the application
main().catch(error => {
  logger.error('Application error', error);
  process.exit(1);
});