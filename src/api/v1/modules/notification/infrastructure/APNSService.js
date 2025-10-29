/**
 * Apple Push Notification Service (APNS) Service
 * Handles push notifications for iOS devices
 */
import apn from '@parse/node-apn';
import fs from 'fs';

class APNSService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ context: 'APNSService' });
    this.enabled = config.get('pushNotifications.apns.enabled') || false;
    this.provider = null;

    if (this.enabled) {
      this.initialize();
    } else {
      this.logger.info('APNS service is disabled');
    }
  }

  /**
   * Initialize APNS provider
   */
  initialize() {
    try {
      const keyPath = this.config.get('pushNotifications.apns.keyPath');
      const keyId = this.config.get('pushNotifications.apns.keyId');
      const teamId = this.config.get('pushNotifications.apns.teamId');
      const bundleId = this.config.get('pushNotifications.apns.bundleId');
      const production = this.config.get('pushNotifications.apns.production') || false;

      if (!keyPath || !fs.existsSync(keyPath)) {
        throw new Error('APNS key file not found');
      }

      if (!keyId || !teamId || !bundleId) {
        throw new Error('APNS credentials not properly configured');
      }

      const options = {
        token: {
          key: keyPath,
          keyId,
          teamId,
        },
        production,
      };

      this.provider = new apn.Provider(options);
      this.bundleId = bundleId;
      this.logger.info({ production }, 'APNS service initialized successfully');
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to initialize APNS service');
      this.enabled = false;
    }
  }

  /**
   * Check if APNS is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.enabled && this.provider !== null;
  }

  /**
   * Send notification to a single device
   * @param {string} token - Device APNS token
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(token, notification, data = {}) {
    if (!this.isAvailable()) {
      throw new Error('APNS service is not available');
    }

    try {
      const apnNotification = new apn.Notification();
      apnNotification.topic = this.bundleId;
      apnNotification.alert = {
        title: notification.title,
        body: notification.message,
      };
      apnNotification.sound = 'default';
      apnNotification.badge = 1;
      apnNotification.priority = this.mapPriority(notification.priority);
      
      // Custom data
      apnNotification.payload = {
        ...data,
        notificationId: notification.id?.toString() || '',
        type: notification.type || 'general',
        timestamp: new Date().toISOString(),
      };

      // Set expiration (7 days from now)
      apnNotification.expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      const result = await this.provider.send(apnNotification, token);
      
      if (result.failed && result.failed.length > 0) {
        const error = result.failed[0];
        this.logger.error(
          { error: error.response?.reason, token: '***' },
          'APNS notification failed'
        );
        throw new Error(error.response?.reason || 'APNS notification failed');
      }

      this.logger.info({ token: '***', sent: result.sent.length }, 'APNS notification sent successfully');
      return result;
    } catch (error) {
      this.logger.error({ error: error.message, token: '***' }, 'Failed to send APNS notification');
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   * @param {string[]} tokens - Array of device APNS tokens
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Batch result
   */
  async sendToMultipleDevices(tokens, notification, data = {}) {
    if (!this.isAvailable()) {
      throw new Error('APNS service is not available');
    }

    if (!tokens || tokens.length === 0) {
      this.logger.warn('No tokens provided for APNS notification');
      return { successCount: 0, failureCount: 0, failed: [] };
    }

    try {
      const apnNotification = new apn.Notification();
      apnNotification.topic = this.bundleId;
      apnNotification.alert = {
        title: notification.title,
        body: notification.message,
      };
      apnNotification.sound = 'default';
      apnNotification.badge = 1;
      apnNotification.priority = this.mapPriority(notification.priority);
      
      apnNotification.payload = {
        ...data,
        notificationId: notification.id?.toString() || '',
        type: notification.type || 'general',
        timestamp: new Date().toISOString(),
      };

      apnNotification.expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      const result = await this.provider.send(apnNotification, tokens);
      
      this.logger.info(
        {
          successCount: result.sent.length,
          failureCount: result.failed.length,
          totalTokens: tokens.length,
        },
        'APNS batch notification sent'
      );

      // Log failed tokens
      if (result.failed.length > 0) {
        this.logger.warn(
          { failedCount: result.failed.length },
          'Some APNS notifications failed'
        );
      }

      return {
        successCount: result.sent.length,
        failureCount: result.failed.length,
        failed: result.failed,
      };
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to send APNS batch notification');
      throw error;
    }
  }

  /**
   * Map priority to APNS priority
   * @param {string} priority - Priority level
   * @returns {number} APNS priority (5 or 10)
   */
  mapPriority(priority) {
    // APNS priority: 10 = immediate, 5 = power considerations
    const priorityMap = {
      urgent: 10,
      high: 10,
      normal: 5,
      low: 5,
    };
    return priorityMap[priority] || 5;
  }

  /**
   * Shutdown the APNS provider
   */
  async shutdown() {
    if (this.provider) {
      await this.provider.shutdown();
      this.logger.info('APNS provider shut down');
    }
  }
}

export default APNSService;
