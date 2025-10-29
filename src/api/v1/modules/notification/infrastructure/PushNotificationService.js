/**
 * Push Notification Service
 * Unified service for sending push notifications via FCM and APNS
 */
class PushNotificationService {
  constructor(fcmService, apnsService, logger) {
    this.fcmService = fcmService;
    this.apnsService = apnsService;
    this.logger = logger.child({ context: 'PushNotificationService' });
  }

  /**
   * Check if push notifications are available
   * @returns {boolean}
   */
  isAvailable() {
    return this.fcmService.isAvailable() || this.apnsService.isAvailable();
  }

  /**
   * Send push notification to a single device
   * @param {Object} deviceToken - Device token object with token and platform
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(deviceToken, notification, data = {}) {
    const { token, platform } = deviceToken;

    try {
      if (platform === 'ios' || platform === 'apns') {
        if (!this.apnsService.isAvailable()) {
          throw new Error('APNS service is not available');
        }
        return await this.apnsService.sendToDevice(token, notification, data);
      } else if (platform === 'android' || platform === 'fcm') {
        if (!this.fcmService.isAvailable()) {
          throw new Error('FCM service is not available');
        }
        return await this.fcmService.sendToDevice(token, notification, data);
      } else if (platform === 'web') {
        // Web push uses FCM
        if (!this.fcmService.isAvailable()) {
          throw new Error('FCM service is not available for web push');
        }
        return await this.fcmService.sendToDevice(token, notification, data);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      this.logger.error(
        { error: error.message, platform, token: '***' },
        'Failed to send push notification to device'
      );
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array<Object>} deviceTokens - Array of device token objects
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Batch result with success and failure counts
   */
  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    if (!deviceTokens || deviceTokens.length === 0) {
      this.logger.warn('No device tokens provided');
      return { successCount: 0, failureCount: 0, results: [] };
    }

    // Group tokens by platform
    const iosTokens = [];
    const androidTokens = [];
    const webTokens = [];

    deviceTokens.forEach((dt) => {
      if (dt.platform === 'ios' || dt.platform === 'apns') {
        iosTokens.push(dt.token);
      } else if (dt.platform === 'android' || dt.platform === 'fcm') {
        androidTokens.push(dt.token);
      } else if (dt.platform === 'web') {
        webTokens.push(dt.token);
      }
    });

    const results = [];
    let totalSuccess = 0;
    let totalFailure = 0;

    // Send to iOS devices
    if (iosTokens.length > 0 && this.apnsService.isAvailable()) {
      try {
        const result = await this.apnsService.sendToMultipleDevices(iosTokens, notification, data);
        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        results.push({ platform: 'ios', ...result });
      } catch (error) {
        this.logger.error({ error: error.message }, 'Failed to send to iOS devices');
        totalFailure += iosTokens.length;
      }
    }

    // Send to Android devices
    if (androidTokens.length > 0 && this.fcmService.isAvailable()) {
      try {
        const result = await this.fcmService.sendToMultipleDevices(androidTokens, notification, data);
        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        results.push({ platform: 'android', successCount: result.successCount, failureCount: result.failureCount });
      } catch (error) {
        this.logger.error({ error: error.message }, 'Failed to send to Android devices');
        totalFailure += androidTokens.length;
      }
    }

    // Send to Web devices (via FCM)
    if (webTokens.length > 0 && this.fcmService.isAvailable()) {
      try {
        const result = await this.fcmService.sendToMultipleDevices(webTokens, notification, data);
        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        results.push({ platform: 'web', successCount: result.successCount, failureCount: result.failureCount });
      } catch (error) {
        this.logger.error({ error: error.message }, 'Failed to send to Web devices');
        totalFailure += webTokens.length;
      }
    }

    this.logger.info(
      {
        totalDevices: deviceTokens.length,
        successCount: totalSuccess,
        failureCount: totalFailure,
      },
      'Push notification batch sent'
    );

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      results,
    };
  }

  /**
   * Send notification to a topic (FCM only)
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<string>} Message ID
   */
  async sendToTopic(topic, notification, data = {}) {
    if (!this.fcmService.isAvailable()) {
      throw new Error('FCM service is not available for topic messaging');
    }

    return await this.fcmService.sendToTopic(topic, notification, data);
  }

  /**
   * Subscribe devices to a topic (FCM only)
   * @param {string[]} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Subscription response
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.fcmService.isAvailable()) {
      throw new Error('FCM service is not available for topic management');
    }

    return await this.fcmService.subscribeToTopic(tokens, topic);
  }

  /**
   * Unsubscribe devices from a topic (FCM only)
   * @param {string[]} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Unsubscription response
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.fcmService.isAvailable()) {
      throw new Error('FCM service is not available for topic management');
    }

    return await this.fcmService.unsubscribeFromTopic(tokens, topic);
  }
}

export default PushNotificationService;
