const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class HttpClient {
  constructor(baseUrl, proxyUrl = null) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
      }
    });

    if (proxyUrl) {
      this.setProxy(proxyUrl);
    }

    // Add request interceptor for logging
    this.client.interceptors.request.use(config => {
      const logger = require('./logger');
      logger.debug(`Request: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => {
        const logger = require('./logger');
        logger.debug(`Response: ${response.status} ${response.statusText}`);
        return response;
      },
      error => {
        const logger = require('./logger');
        
        if (error.response) {
          logger.debug(`HTTP Error: ${error.response.status}`, error);
        } else if (error.request) {
          logger.debug('Network Error', error);
        } else {
          logger.debug('Error', error);
        }
        return Promise.reject(error);
      }
    );
  }

  setProxy(proxyUrl) {
    const agent = new HttpsProxyAgent(proxyUrl);
    this.client.defaults.httpsAgent = agent;
    this.client.defaults.proxy = false; // Disable axios proxy handling, let agent handle it
  }

  setAuthToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

module.exports = HttpClient;