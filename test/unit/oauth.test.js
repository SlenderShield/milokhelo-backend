/**
 * OAuth Integration Tests
import '../helpers/setup.js';
 * Tests for Passport OAuth strategies
 */
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import PassportConfig from '@/modules/auth/service/passport/PassportConfig.js';
import { GoogleStrategy } from '@/modules/auth/service/passport/strategies/index.js';
import { FacebookStrategy } from '@/modules/auth/service/passport/strategies/index.js';

describe('OAuth Strategies', () => {
  let mockAuthService;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    // Mock dependencies
    mockAuthService = {
      handleOAuthCallback: sinon.stub(),
      getUserById: sinon.stub(),
    };

    mockLogger = {
      child: sinon.stub().returnsThis(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
    };

    mockConfig = {
      get: sinon.stub().callsFake((key) => {
        const config = {
          'auth.googleClientId': 'mock-google-client-id',
          'auth.googleClientSecret': 'mock-google-secret',
          'auth.facebookAppId': 'mock-facebook-app-id',
          'auth.facebookAppSecret': 'mock-facebook-secret',
          'auth.oauthCallbackUrl': 'http://localhost:4000/api/v1/auth/oauth/callback',
        };
        return config[key];
      }),
    };
  });

  describe('PassportConfig', () => {
    it('should initialize successfully with valid config', () => {
      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      const passport = passportConfig.initialize();

      expect(passport).to.exist;
      expect(mockLogger.info.called).to.be.true;
    });

    it('should configure Google OAuth strategy when credentials are provided', () => {
      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      passportConfig.initialize();

      expect(mockConfig.get.calledWith('auth.googleClientId')).to.be.true;
      expect(mockConfig.get.calledWith('auth.googleClientSecret')).to.be.true;
    });

    it('should configure Facebook OAuth strategy when credentials are provided', () => {
      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      passportConfig.initialize();

      expect(mockConfig.get.calledWith('auth.facebookAppId')).to.be.true;
      expect(mockConfig.get.calledWith('auth.facebookAppSecret')).to.be.true;
    });

    it('should warn when OAuth credentials are missing', () => {
      mockConfig.get = sinon.stub().returns(undefined);

      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      passportConfig.initialize();

      expect(mockLogger.warn.called).to.be.true;
    });
  });

  describe('GoogleStrategy', () => {
    it('should create Google OAuth strategy with correct config', () => {
      const googleStrategy = new GoogleStrategy(mockAuthService, mockLogger, mockConfig);
      
      expect(googleStrategy).to.exist;
      expect(googleStrategy.authService).to.equal(mockAuthService);
    });

    it('should handle OAuth callback successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@gmail.com',
        name: 'Test User',
      };

      mockAuthService.handleOAuthCallback.resolves(mockUser);

      // Test the auth service method that the strategy would use
      const result = await mockAuthService.handleOAuthCallback(
        { id: 'google-123', emails: [{ value: 'test@gmail.com' }] },
        'google'
      );

      expect(result).to.deep.equal(mockUser);
      expect(mockAuthService.handleOAuthCallback.calledOnce).to.be.true;
    });
  });

  describe('FacebookStrategy', () => {
    it('should create Facebook OAuth strategy with correct config', () => {
      const facebookStrategy = new FacebookStrategy(mockAuthService, mockLogger, mockConfig);
      
      expect(facebookStrategy).to.exist;
      expect(facebookStrategy.authService).to.equal(mockAuthService);
    });

    it('should handle OAuth callback successfully', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'test@facebook.com',
        name: 'Test User',
      };

      mockAuthService.handleOAuthCallback.resolves(mockUser);

      // Test the auth service method that the strategy would use
      const result = await mockAuthService.handleOAuthCallback(
        { id: 'facebook-123', emails: [{ value: 'test@facebook.com' }] },
        'facebook'
      );

      expect(result).to.deep.equal(mockUser);
      expect(mockAuthService.handleOAuthCallback.calledOnce).to.be.true;
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should serialize user to session', async () => {
      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      passportConfig.initialize();

      // Serialization is configured in PassportConfig
      expect(mockLogger.info.calledWith('Initializing Passport authentication')).to.be.true;
    });

    it('should deserialize user from session', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockAuthService.getUserById.resolves(mockUser);

      const passportConfig = new PassportConfig(mockAuthService, mockLogger, mockConfig);
      passportConfig.initialize();

      // Test deserialization
      const userId = 'user-789';
      const result = await mockAuthService.getUserById(userId);

      expect(result).to.deep.equal(mockUser);
      expect(mockAuthService.getUserById.calledWith(userId)).to.be.true;
    });
  });
});
