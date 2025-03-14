const HttpClient = require('../utils/http');
const logger = require('../utils/logger');
const { withRetry, sleep } = require('../utils/retry');
const config = require('../config/config').config;
const Web3 = require('web3');

class ApiService {
  constructor(privateKey, proxyUrl = null) {
    this.privateKey = privateKey;
    this.web3 = new Web3();
    
    // Create wallet from private key
    this.wallet = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.walletAddress = this.wallet.address;
    
    // Initialize HTTP client with hardcoded base URL
    this.httpClient = new HttpClient('https://api.infinityg.ai/api/v1', proxyUrl);
    
    // Token received after login
    this.token = null;
  }

  /**
   * Check if user is logged in
   */
  checkLoginStatus() {
    return !!this.token;
  }

  /**
   * Login to the API using wallet credentials
   */
  async login() {
    try {
      const payload = {
        loginChannel: 'MAIN_PAGE',
        walletChain: 'BNB Smart Chain',
        walletType: 'metamask',
        walletAddress: this.walletAddress,
        inviteCode: '20YDKU'  // Can be empty or filled with a valid invite code
      };

      const response = await withRetry(
        () => this.httpClient.post('/user/auth/wallet_login', payload),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        this.token = response.data.data.token;
        this.httpClient.setAuthToken(this.token);
        logger.success(`Successfully logged in. Username: ${response.data.data.userName}`, this.walletAddress);
        return true;
      } else {
        logger.error('Login failed', response.data, this.walletAddress);
        return false;
      }
    } catch (error) {
      logger.error('Login error', error, this.walletAddress);
      return false;
    }
  }

  /**
   * Get task list from the API
   */
  async getTaskList() {
    try {
      const response = await withRetry(
        () => this.httpClient.post('/task/list'),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        logger.info('Task list retrieved successfully', this.walletAddress);
        return response.data.data;
      } else {
        logger.error('Failed to get task list', response.data, this.walletAddress);
        return null;
      }
    } catch (error) {
      logger.error('Error getting task list', error, this.walletAddress);
      return null;
    }
  }

  /**
   * Perform daily check-in
   */
  async checkIn() {
    try {
      const response = await withRetry(
        () => this.httpClient.post('/task/checkIn/'),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        logger.success('Check-in completed successfully', this.walletAddress);
        return true;
      } else {
        logger.error('Check-in failed', response.data, this.walletAddress);
        return false;
      }
    } catch (error) {
      logger.error('Error during check-in', error, this.walletAddress);
      return false;
    }
  }

  /**
   * Claim check-in rewards
   */
  async claimCheckIn() {
    try {
      const response = await withRetry(
        () => this.httpClient.post('/task/checkIn/'),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        logger.success(`Check-in rewards claimed successfully`, this.walletAddress);
        return true;
      } else {
        logger.error(`Failed to claim check-in rewards`, response.data, this.walletAddress);
        return false;
      }
    } catch (error) {
      logger.error(`Error claiming check-in rewards`, error, this.walletAddress);
      return false;
    }
  }

  /**
   * Complete a task
   * @param {number} taskId - ID of the task to complete
   */
  async completeTask(taskId) {
    try {
      const response = await withRetry(
        () => this.httpClient.post('/task/complete', { taskId }),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        logger.success(`Task ${taskId} completed successfully`, this.walletAddress);
        return true;
      } else {
        logger.error(`Failed to complete task ${taskId}`, response.data, this.walletAddress);
        return false;
      }
    } catch (error) {
      logger.error(`Error completing task ${taskId}`, error, this.walletAddress);
      return false;
    }
  }

  /**
   * Claim rewards for a task
   * @param {number} taskId - ID of the task to claim
   */
  async claimTask(taskId) {
    try {
      const response = await withRetry(
        () => this.httpClient.post('/task/claim', { taskId }),
        {
          maxRetries: config.retryCount,
          initialDelay: config.retryDelay,
          walletAddress: this.walletAddress
        }
      );

      if (response.data && response.data.code === '90000') {
        logger.success(`Task ${taskId} claimed successfully`, this.walletAddress);
        return true;
      } else {
        logger.error(`Failed to claim task ${taskId}`, response.data, this.walletAddress);
        return false;
      }
    } catch (error) {
      logger.error(`Error claiming task ${taskId}`, error, this.walletAddress);
      return false;
    }
  }

  /**
   * Process all available tasks based on the current configuration
   */
  async processAllTasks() {
    try {
      // Check if user is logged in
      if (!this.checkLoginStatus()) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          logger.error('Cannot process tasks, login failed', null, this.walletAddress);
          return false;
        }
      }

      // Get task list
      let taskData = await this.getTaskList();
      if (!taskData) {
        logger.error('Cannot process tasks, failed to get task list', null, this.walletAddress);
        return false;
      }

      // Process check-in if enabled
      if (config.enableCheckIn) {
        const checkInList = taskData.checkInList || [];
        
        // Format date as YYYY-MM-DD to match the API format
        const today = new Date().toISOString().split('T')[0];
        logger.debug(`Today's date: ${today}, Checking check-in list...`, this.walletAddress);
        
        // Log all check-in dates and statuses for debugging
        checkInList.forEach(item => {
          logger.debug(`Check-in date: ${item.date}, status: ${item.status}, points: ${item.point}`, this.walletAddress);
        });
        
        const todayCheckIn = checkInList.find(item => item.date === today);
        
        if (todayCheckIn) {
          logger.debug(`Found today's check-in: status ${todayCheckIn.status}`, this.walletAddress);
          
          // Handle different check-in status codes
          if (todayCheckIn.status === 0) {
            // Status 0: Available to check-in
            logger.info(`Performing daily check-in for ${today}...`, this.walletAddress);
            const checkInSuccess = await this.checkIn();
            
            if (checkInSuccess) {
              logger.success(`Check-in completed successfully for ${today}`, this.walletAddress);
              
              // Refresh task list after check-in
              await sleep(config.taskDelay);
              taskData = await this.getTaskList();
              
              // Try to claim the check-in rewards immediately
              await this.claimCheckIn();
            } else {
              logger.error(`Check-in failed for ${today}`, null, this.walletAddress);
            }
          } else if (todayCheckIn.status === 2) {
            // Status 2: Checked in but not claimed
            logger.info(`Check-in completed but not claimed for ${today}, claiming now...`, this.walletAddress);
            const claimSuccess = await this.claimCheckIn();
            
            if (claimSuccess) {
              logger.success(`Check-in rewards claimed successfully for ${today}`, this.walletAddress);
            } else {
              logger.error(`Failed to claim check-in rewards for ${today}`, null, this.walletAddress);
            }
          } else {
            logger.warn(`Daily check-in status for ${today}: ${todayCheckIn.status}`, this.walletAddress);
          }
        } else {
          logger.error(`Could not find check-in data for today (${today})`, null, this.walletAddress);
        }
      }

      // Process tasks if enabled
      if (config.enableTask) {
        const taskModels = taskData.taskModelResponses || [];
        let totalTasksCompleted = 0;
        
        for (const taskModel of taskModels) {
          logger.info(`Processing task model: ${taskModel.taskModelName}`, this.walletAddress);
          
          const tasks = taskModel.taskResponseList || [];
          for (const task of tasks) {
            // Skip "Share with your friends" task as requested
            if (task.taskName === "Share with your friends" || task.taskName === "Invitation Link") {
              logger.info(`Skipping task: ${task.taskName}`, this.walletAddress);
              continue;
            }
            
            // Process task based on status
            // Status codes: 0 = not done, 1 = in progress, 2 = completed (needs claiming), 3 = claimed
            if (task.status === 0) {
              // Need to complete and claim
              logger.info(`Completing task: ${task.taskName} (ID: ${task.taskId})`, this.walletAddress);
              const completeSuccess = await this.completeTask(task.taskId);
              
              if (completeSuccess) {
                // Wait before claiming
                await sleep(config.taskDelay);
                
                // Claim task
                logger.info(`Claiming task: ${task.taskName} (ID: ${task.taskId})`, this.walletAddress);
                const claimSuccess = await this.claimTask(task.taskId);
                
                if (claimSuccess) {
                  totalTasksCompleted++;
                }
              }
              
              // Add delay between tasks
              await sleep(config.taskDelay);
            } else if (task.status === 2) {
              // Already completed but needs claiming
              logger.info(`Task already completed, claiming: ${task.taskName} (ID: ${task.taskId})`, this.walletAddress);
              
              const claimSuccess = await this.claimTask(task.taskId);
              if (claimSuccess) {
                totalTasksCompleted++;
              }
              
              await sleep(config.taskDelay);
            } else if (task.status === 3) {
              logger.warn(`Task already claimed: ${task.taskName} (ID: ${task.taskId})`, this.walletAddress);
            } else {
              logger.warn(`Task in unknown state (${task.status}): ${task.taskName} (ID: ${task.taskId})`, this.walletAddress);
            }
          }
        }
        
        logger.success(`Completed ${totalTasksCompleted} tasks. Current points: ${taskData.totalPoint}`, this.walletAddress);
      }

      return true;
    } catch (error) {
      logger.error('Error processing tasks', error, this.walletAddress);
      return false;
    }
  }
}

module.exports = ApiService;