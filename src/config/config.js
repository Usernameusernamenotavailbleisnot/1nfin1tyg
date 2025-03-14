const fs = require('fs-extra');
const path = require('path');

// Default configuration
const defaultConfig = {
  enableProxy: false,
  enableTask: true,
  enableCheckIn: true,
  debugMode: false, // Enable debug mode by default for date-related issues
  retryCount: 3,
  retryDelay: 1000,
  taskDelay: 1000,
  dailyDelay: 25 * 60 * 60 * 1000, // 25 hours in milliseconds
  logFormat: 'DD/MM/YYYY - HH:MM:SS'
};

class ConfigManager {
  constructor() {
    this.config = { ...defaultConfig };
    this.privateKeys = [];
    this.proxies = [];
    this.loadConfig();
    this.loadPrivateKeys();
    this.loadProxies();
  }

  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config.json');
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.config = { ...this.config, ...userConfig };
        
        // Set debug mode for logger
        const logger = require('../utils/logger');
        logger.setDebugMode(this.config.debugMode);
      } else {
        // Create default config if it doesn't exist
        fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      }
    } catch (error) {
      console.error('Error loading configuration:', error.message);
      process.exit(1);
    }
  }

  loadPrivateKeys() {
    try {
      const pkPath = path.join(process.cwd(), 'pk.txt');
      if (fs.existsSync(pkPath)) {
        const content = fs.readFileSync(pkPath, 'utf8');
        this.privateKeys = content.split('\n').map(line => line.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('Error loading private keys:', error.message);
      process.exit(1);
    }
  }

  loadProxies() {
    if (!this.config.enableProxy) return;
    
    try {
      const proxyPath = path.join(process.cwd(), 'proxy.txt');
      if (fs.existsSync(proxyPath)) {
        const content = fs.readFileSync(proxyPath, 'utf8');
        this.proxies = content.split('\n').map(line => line.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('Error loading proxies:', error.message);
    }
  }

  getProxy(index) {
    if (!this.config.enableProxy || this.proxies.length === 0) return null;
    return this.proxies[index % this.proxies.length];
  }

  getCredentials() {
    return this.privateKeys.map((pk, index) => ({
      privateKey: pk,
      proxy: this.getProxy(index)
    }));
  }
}

module.exports = new ConfigManager();