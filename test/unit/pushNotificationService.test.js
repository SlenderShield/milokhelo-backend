/**
 * Unit Tests for Push Notification Service
 */
import '../helpers/setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import PushNotificationService from '../../src/api/v1/modules/notification/infrastructure/PushNotificationService.js';

describe('PushNotificationService', () => {
  let pushNotificationService;
  let mockFcmService;
  let mockApnsService;
  let mockLogger;

  beforeEach(() => {
    mockFcmService = {
      isAvailable: sinon.stub().returns(true),
      sendToDevice: sinon.stub().resolves({ messageId: 'fcm-123' }),
      sendToMultipleDevices: sinon.stub().resolves({
        successCount: 2,
        failureCount: 0,
      }),
      sendToTopic: sinon.stub().resolves('topic-message-id'),
      subscribeToTopic: sinon.stub().resolves({ successCount: 1 }),
      unsubscribeFromTopic: sinon.stub().resolves({ successCount: 1 }),
    };

    mockApnsService = {
      isAvailable: sinon.stub().returns(true),
      sendToDevice: sinon.stub().resolves({ sent: [{}], failed: [] }),
      sendToMultipleDevices: sinon.stub().resolves({
        successCount: 2,
        failureCount: 0,
        failed: [],
      }),
    };

    mockLogger = {
      child: sinon.stub().returnsThis(),
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
    };

    pushNotificationService = new PushNotificationService(
      mockFcmService,
      mockApnsService,
      mockLogger
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isAvailable()', () => {
    it('should return true when FCM is available', () => {
      mockApnsService.isAvailable.returns(false);
      expect(pushNotificationService.isAvailable()).to.be.true;
    });

    it('should return true when APNS is available', () => {
      mockFcmService.isAvailable.returns(false);
      expect(pushNotificationService.isAvailable()).to.be.true;
    });

    it('should return false when neither service is available', () => {
      mockFcmService.isAvailable.returns(false);
      mockApnsService.isAvailable.returns(false);
      expect(pushNotificationService.isAvailable()).to.be.false;
    });
  });

  describe('sendToDevice()', () => {
    const notification = {
      id: 'notif-123',
      title: 'Test Notification',
      message: 'This is a test',
      type: 'match',
      priority: 'high',
    };

    it('should send to iOS device via APNS', async () => {
      const deviceToken = { token: 'ios-token', platform: 'ios' };

      await pushNotificationService.sendToDevice(deviceToken, notification);

      expect(mockApnsService.sendToDevice.calledOnce).to.be.true;
      expect(mockFcmService.sendToDevice.called).to.be.false;
    });

    it('should send to Android device via FCM', async () => {
      const deviceToken = { token: 'android-token', platform: 'android' };

      await pushNotificationService.sendToDevice(deviceToken, notification);

      expect(mockFcmService.sendToDevice.calledOnce).to.be.true;
      expect(mockApnsService.sendToDevice.called).to.be.false;
    });

    it('should send to web device via FCM', async () => {
      const deviceToken = { token: 'web-token', platform: 'web' };

      await pushNotificationService.sendToDevice(deviceToken, notification);

      expect(mockFcmService.sendToDevice.calledOnce).to.be.true;
      expect(mockApnsService.sendToDevice.called).to.be.false;
    });

    it('should throw error for unsupported platform', async () => {
      const deviceToken = { token: 'unknown-token', platform: 'unknown' };

      try {
        await pushNotificationService.sendToDevice(deviceToken, notification);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Unsupported platform');
      }
    });

    it('should throw error when service is not available', async () => {
      mockFcmService.isAvailable.returns(false);
      const deviceToken = { token: 'android-token', platform: 'android' };

      try {
        await pushNotificationService.sendToDevice(deviceToken, notification);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('not available');
      }
    });
  });

  describe('sendToMultipleDevices()', () => {
    const notification = {
      title: 'Test Notification',
      message: 'This is a test',
      type: 'tournament',
    };

    it('should send to multiple devices across platforms', async () => {
      const deviceTokens = [
        { token: 'ios-1', platform: 'ios' },
        { token: 'ios-2', platform: 'ios' },
        { token: 'android-1', platform: 'android' },
        { token: 'android-2', platform: 'android' },
      ];

      const result = await pushNotificationService.sendToMultipleDevices(
        deviceTokens,
        notification
      );

      expect(mockApnsService.sendToMultipleDevices.calledOnce).to.be.true;
      expect(mockFcmService.sendToMultipleDevices.calledOnce).to.be.true;
      expect(result.successCount).to.equal(4);
      expect(result.failureCount).to.equal(0);
    });

    it('should handle empty device token array', async () => {
      const result = await pushNotificationService.sendToMultipleDevices(
        [],
        notification
      );

      expect(result.successCount).to.equal(0);
      expect(result.failureCount).to.equal(0);
      expect(mockLogger.warn.called).to.be.true;
    });

    it('should continue on platform-specific failures', async () => {
      mockApnsService.sendToMultipleDevices.rejects(new Error('APNS failed'));

      const deviceTokens = [
        { token: 'ios-1', platform: 'ios' },
        { token: 'android-1', platform: 'android' },
      ];

      const result = await pushNotificationService.sendToMultipleDevices(
        deviceTokens,
        notification
      );

      // Should still succeed for Android
      expect(result.successCount).to.equal(2);
      expect(mockLogger.error.called).to.be.true;
    });
  });

  describe('sendToTopic()', () => {
    it('should send to FCM topic', async () => {
      const notification = {
        title: 'Announcement',
        message: 'System maintenance',
      };

      const result = await pushNotificationService.sendToTopic(
        'announcements',
        notification
      );

      expect(mockFcmService.sendToTopic.calledOnce).to.be.true;
      expect(result).to.equal('topic-message-id');
    });

    it('should throw error when FCM is not available', async () => {
      mockFcmService.isAvailable.returns(false);

      try {
        await pushNotificationService.sendToTopic('topic', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('not available');
      }
    });
  });

  describe('subscribeToTopic()', () => {
    it('should subscribe devices to FCM topic', async () => {
      const tokens = ['token1', 'token2'];

      const result = await pushNotificationService.subscribeToTopic(
        tokens,
        'news'
      );

      expect(mockFcmService.subscribeToTopic.calledOnce).to.be.true;
      expect(result.successCount).to.equal(1);
    });
  });

  describe('unsubscribeFromTopic()', () => {
    it('should unsubscribe devices from FCM topic', async () => {
      const tokens = ['token1', 'token2'];

      const result = await pushNotificationService.unsubscribeFromTopic(
        tokens,
        'news'
      );

      expect(mockFcmService.unsubscribeFromTopic.calledOnce).to.be.true;
      expect(result.successCount).to.equal(1);
    });
  });
});
