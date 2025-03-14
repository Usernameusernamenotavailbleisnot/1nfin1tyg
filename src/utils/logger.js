const winston = require('winston');
const { format } = winston;
const twisters = require('twisters');
const chalk = require('chalk'); // Add chalk for colored console output

// Custom formatter for timestamps and wallet addresses
const customFormat = format.printf(({ level, message, timestamp, walletAddress }) => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-GB').replace(/\//g, '/');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds}`;
  
  // Format wallet address if provided
  let addressPart = '';
  if (walletAddress) {
    if (walletAddress.length > 8) {
      addressPart = walletAddress.substring(0, 4) + '****' + walletAddress.substring(walletAddress.length - 4);
    } else {
      addressPart = walletAddress;
    }
    addressPart = ` - ${addressPart}`;
  }
  
  return `[${formattedDate} - ${time}${addressPart}] ${message}`;
});

// Create winston logger for file logging
const fileLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'infinityg-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Custom logger with formatted output for console
class CustomLogger {
  constructor() {
    this.spinners = {};
    this.debugMode = false; // By default, debug mode is off
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  _formatErrorMessage(error) {
    if (!error) return '';
    
    if (error.response) {
      // HTTP error
      const status = error.response.status;
      const statusText = error.response.statusText;
      const data = error.response.data;
      let errorMsg = ` - HTTP Error: ${status} ${statusText}`;
      if (data) {
        errorMsg += ` - ${JSON.stringify(data)}`;
      }
      return errorMsg;
    } else if (error.request) {
      // Network error
      return ` - Network Error: ${error.message}`;
    } else {
      // General error
      return ` - Error: ${error.message}`;
    }
  }

  debug(message, walletAddress = '') {
    // Only log in debug mode
    if (!this.debugMode) return;
    
    // Log to file
    fileLogger.debug(message, { walletAddress });
    
    // Log to console with custom format and color
    const formattedMessage = customFormat.template({ 
      level: 'debug',
      message,
      walletAddress
    });
    
    console.log(chalk.gray(formattedMessage));
  }

  info(message, walletAddress = '') {
    // Log to file
    fileLogger.info(message, { walletAddress });
    
    // Log to console with custom format and color
    const formattedMessage = customFormat.template({ 
      level: 'info',
      message,
      walletAddress
    });
    
    console.log(chalk.cyan(formattedMessage));
  }

  success(message, walletAddress = '') {
    // Log to file
    fileLogger.info(message, { walletAddress });
    
    // Log to console with custom format and color
    const formattedMessage = customFormat.template({ 
      level: 'info',
      message,
      walletAddress
    });
    
    console.log(chalk.green(formattedMessage));
  }

  warn(message, walletAddress = '') {
    // Log to file
    fileLogger.warn(message, { walletAddress });
    
    // Log to console with custom format and color
    const formattedMessage = customFormat.template({ 
      level: 'warn',
      message,
      walletAddress
    });
    
    console.log(chalk.yellow(formattedMessage));
  }

  error(message, error = null, walletAddress = '') {
    // Format error message
    const errorMsg = message + this._formatErrorMessage(error);
    
    // Log to file with error details
    fileLogger.error(errorMsg, { walletAddress, error });
    
    // Log to console with custom format and color
    const formattedMessage = customFormat.template({ 
      level: 'error',
      message: errorMsg,
      walletAddress
    });
    
    console.error(chalk.red(formattedMessage));
  }

  startSpinner(id, message) {
    this.spinners[id] = twisters({ text: message });
  }

  updateSpinner(id, message, status = null) {
    if (this.spinners[id]) {
      this.spinners[id].text = message;
      if (status === 'success' || status === 'error') {
        this.spinners[id].end();
        delete this.spinners[id];
      }
    }
  }
}

module.exports = new CustomLogger();