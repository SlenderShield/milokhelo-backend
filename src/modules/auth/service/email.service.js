/**
 * Email Service
 * Handles sending emails for authentication-related notifications
 * Currently uses console fallback for development, can be extended with real email providers
 */
class EmailService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ context: 'EmailService' });
    this.fromEmail = config.get('email.from') || 'noreply@milokhelo.com';
    this.frontendUrl = config.get('auth.frontendUrl');
  }

  /**
   * Send email verification
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} token - Verification token
   */
  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${this.frontendUrl}/verify-email/${token}`;

    const emailContent = {
      to: email,
      from: this.fromEmail,
      subject: 'Verify your email - Milokhelo',
      text: `Hi ${name},\n\nPlease verify your email by clicking the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
      html: `
        <h2>Welcome to Milokhelo!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    };

    await this.sendEmail(emailContent);
    this.logger.info('Verification email sent', { email });
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} token - Reset token
   */
  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${this.frontendUrl}/reset-password/${token}`;

    const emailContent = {
      to: email,
      from: this.fromEmail,
      subject: 'Reset your password - Milokhelo',
      text: `Hi ${name},\n\nYou requested to reset your password. Click the link below to proceed:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email and your password will remain unchanged.`,
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      `,
    };

    await this.sendEmail(emailContent);
    this.logger.info('Password reset email sent', { email });
  }

  /**
   * Send password changed confirmation email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   */
  async sendPasswordChangedEmail(email, name) {
    const emailContent = {
      to: email,
      from: this.fromEmail,
      subject: 'Your password has been changed - Milokhelo',
      text: `Hi ${name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.`,
      html: `
        <h2>Password Changed</h2>
        <p>Hi ${name},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `,
    };

    await this.sendEmail(emailContent);
    this.logger.info('Password changed confirmation email sent', { email });
  }

  /**
   * Send account deactivation confirmation email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   */
  async sendAccountDeactivatedEmail(email, name) {
    const emailContent = {
      to: email,
      from: this.fromEmail,
      subject: 'Your account has been deactivated - Milokhelo',
      text: `Hi ${name},\n\nYour account has been deactivated as requested.\n\nIf you want to reactivate your account, please contact support.`,
      html: `
        <h2>Account Deactivated</h2>
        <p>Hi ${name},</p>
        <p>Your account has been deactivated as requested.</p>
        <p>If you want to reactivate your account, please contact support.</p>
      `,
    };

    await this.sendEmail(emailContent);
    this.logger.info('Account deactivation email sent', { email });
  }

  /**
   * Send email using configured provider
   * @param {Object} emailData - Email data
   * @private
   */
  async sendEmail(emailData) {
    try {
      // For now, log to console (development)
      // In production, integrate with SendGrid, AWS SES, or similar
      if (this.config.get('env') === 'production') {
        // TODO: Integrate with real email service (SendGrid, AWS SES, etc.)
        this.logger.warn('Email service not configured for production', { to: emailData.to });
      } else {
        this.logger.debug('Email would be sent', {
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.text,
        });
        console.log('\n=== EMAIL ===');
        console.log(`To: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Content:\n${emailData.text}`);
        console.log('=============\n');
      }
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send email', { error: error.message, to: emailData.to });
      throw error;
    }
  }
}

export default EmailService;
