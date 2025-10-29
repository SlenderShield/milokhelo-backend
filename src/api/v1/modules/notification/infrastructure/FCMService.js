/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications via Firebase
 */
import admin from 'firebase-admin';
import fs from 'fs';

class FCMService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ context: 'FCMService' });
    this.enabled = config.get('pushNotifications.fcm.enabled') || false;
    this.initialized = false;

    if (this.enabled) {
      this.initialize();
    } else {
      this.logger.info('FCM service is disabled');
    }
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      const serviceAccountPath = this.config.get('pushNotifications.fcm.serviceAccountPath');
      const projectId = this.config.get('pushNotifications.fcm.projectId');
      const clientEmail = this.config.get('pushNotifications.fcm.clientEmail');
      const privateKey = this.config.get('pushNotifications.fcm.privateKey');

      let credential;

      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        // Use service account file
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        credential = admin.credential.cert(serviceAccount);
      } else if (projectId && clientEmail && privateKey) {
        // Use environment variables
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        });
      } else {
        throw new Error('FCM credentials not properly configured');
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential,
        });
      }

      this.messaging = admin.messaging();
      this.initialized = true;
      this.logger.info('FCM service initialized successfully');
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to initialize FCM service');
      this.enabled = false;
    }
  }

  /**
   * Check if FCM is enabled and initialized
   * @returns {boolean}
   */
  isAvailable() {
    return this.enabled && this.initialized;
  }

  /**
   * Send notification to a single device
   * @param {string} token - Device FCM token
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<string>} Message ID
   */
  async sendToDevice(token, notification, data = {}) {
    if (!this.isAvailable()) {
      throw new Error('FCM service is not available');
    }

    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          ...data,
          notificationId: notification.id?.toString() || '',
          type: notification.type || 'general',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: this.mapPriority(notification.priority),
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      this.logger.info({ messageId: response, token: '***' }, 'FCM notification sent successfully');
      return response;
    } catch (error) {
      this.logger.error({ error: error.message, token: '***' }, 'Failed to send FCM notification');
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   * @param {string[]} tokens - Array of device FCM tokens
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Batch response
   */
  async sendToMultipleDevices(tokens, notification, data = {}) {
    if (!this.isAvailable()) {
      throw new Error('FCM service is not available');
    }

    if (!tokens || tokens.length === 0) {
      this.logger.warn('No tokens provided for FCM notification');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          ...data,
          notificationId: notification.id?.toString() || '',
          type: notification.type || 'general',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: this.mapPriority(notification.priority),
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        tokens,
      };

      const response = await this.messaging.sendEachForMulticast(message);
      this.logger.info(
        { 
          successCount: response.successCount, 
          failureCount: response.failureCount,
          totalTokens: tokens.length 
        },
        'FCM batch notification sent'
      );

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({ token: tokens[idx], error: resp.error?.message });
          }
        });
        this.logger.warn({ failedTokens: failedTokens.length }, 'Some FCM notifications failed');
      }

      return response;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to send FCM batch notification');
      throw error;
    }
  }

  /**
   * Send notification to a topic
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data payload
   * @returns {Promise<string>} Message ID
   */
  async sendToTopic(topic, notification, data = {}) {
    if (!this.isAvailable()) {
      throw new Error('FCM service is not available');
    }

    try {
      const message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          ...data,
          type: notification.type || 'general',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await this.messaging.send(message);
      this.logger.info({ messageId: response, topic }, 'FCM topic notification sent successfully');
      return response;
    } catch (error) {
      this.logger.error({ error: error.message, topic }, 'Failed to send FCM topic notification');
      throw error;
    }
  }

  /**
   * Subscribe devices to a topic
   * @param {string[]} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Subscription response
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.isAvailable()) {
      throw new Error('FCM service is not available');
    }

    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      this.logger.info({ successCount: response.successCount, topic }, 'Subscribed devices to topic');
      return response;
    } catch (error) {
      this.logger.error({ error: error.message, topic }, 'Failed to subscribe to topic');
      throw error;
    }
  }

  /**
   * Unsubscribe devices from a topic
   * @param {string[]} tokens - Device tokens
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Unsubscription response
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.isAvailable()) {
      throw new Error('FCM service is not available');
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      this.logger.info({ successCount: response.successCount, topic }, 'Unsubscribed devices from topic');
      return response;
    } catch (error) {
      this.logger.error({ error: error.message, topic }, 'Failed to unsubscribe from topic');
      throw error;
    }
  }

  /**
   * Map priority to FCM priority
   * @param {string} priority - Priority level
   * @returns {string} FCM priority
   */
  mapPriority(priority) {
    const priorityMap = {
      urgent: 'high',
      high: 'high',
      normal: 'normal',
      low: 'normal',
    };
    return priorityMap[priority] || 'normal';
  }
}

export default FCMService;
