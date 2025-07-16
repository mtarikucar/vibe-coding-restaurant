import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter
   */
  private initializeTransporter(): void {
    try {
      const host = this.configService.get<string>("EMAIL_HOST");
      const port = this.configService.get<number>("EMAIL_PORT");
      const secure = this.configService.get<boolean>("EMAIL_SECURE", false);
      const user = this.configService.get<string>("EMAIL_USER");
      const pass = this.configService.get<string>("EMAIL_PASSWORD");

      // Check if email configuration is provided
      if (!host || !port || !user || !pass) {
        this.logger.warn(
          "Email configuration is incomplete. Emails will be logged but not sent."
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      this.logger.log("Email transporter initialized successfully");
    } catch (error) {
      this.logger.error(
        `Failed to initialize email transporter: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    resetUrl: string
  ): Promise<void> {
    try {
      const frontendUrl = this.configService.get<string>(
        "FRONTEND_URL",
        "http://localhost:5173"
      );
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      const appName = this.configService.get<string>(
        "APP_NAME",
        "Restaurant Management System"
      );
      const from = this.configService.get<string>(
        "EMAIL_FROM",
        `"${appName}" <noreply@restaurant-management.com>`
      );

      // Create HTML email template
      const htmlContent = this.getPasswordResetEmailTemplate(
        email,
        resetLink,
        appName
      );

      // Send email if transporter is available
      if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: "Reset Your Password",
          html: htmlContent,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } else {
        // Log email content if transporter is not available
        this.logger.log(`
          Password Reset Email (Not Sent - Transporter Not Available)
          -------------------
          To: ${email}
          Subject: Reset Your Password

          Content:
          ${htmlContent}
        `);
      }

      return;
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack
      );
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Generate HTML email template for password reset
   */
  private getPasswordResetEmailTemplate(
    email: string,
    resetLink: string,
    appName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your account with the email address: <strong>${email}</strong></p>
            <p>Please click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>Thank you,<br>The ${appName} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const appName = this.configService.get<string>(
        "APP_NAME",
        "Restaurant Management System"
      );
      const from = this.configService.get<string>(
        "EMAIL_FROM",
        `"${appName}" <noreply@restaurant-management.com>`
      );

      // Send email if transporter is available
      if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
        });
        this.logger.log(
          `Email sent to ${options.to} with subject: ${options.subject}`
        );
      } else {
        // Log email content if transporter is not available
        this.logger.log(`
          Email (Not Sent - Transporter Not Available)
          -----
          From: ${from}
          To: ${options.to}
          Subject: ${options.subject}

          Content:
          ${options.html || options.text}
        `);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send trial started email
   */
  async sendTrialStartedEmail(
    email: string,
    trialEndDate: Date,
    planName: string
  ): Promise<boolean> {
    const subject = "Your Free Trial Has Started";
    const formattedDate = trialEndDate.toLocaleDateString();
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Welcome to ${appName}!</h2>
            <p>Hello,</p>
            <p>Your free trial of the <strong>${planName}</strong> plan has started.</p>
            <p>Your trial will end on <strong>${formattedDate}</strong>.</p>
            <p>Enjoy all the features of our platform during your trial period.</p>
            <p>To continue using our services after the trial period, please subscribe to one of our plans.</p>
            <p>Thank you for choosing our platform!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send trial ending soon email
   */
  async sendTrialEndingSoonEmail(
    email: string,
    daysLeft: number,
    trialEndDate: Date,
    planName: string
  ): Promise<boolean> {
    const subject = `Your Free Trial Ends in ${daysLeft} Days`;
    const formattedDate = trialEndDate.toLocaleDateString();
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Your Free Trial is Ending Soon</h2>
            <p>Hello,</p>
            <p>Your free trial of the <strong>${planName}</strong> plan will end in <strong>${daysLeft} days</strong> (on ${formattedDate}).</p>
            <p>To continue using our services without interruption, please subscribe to one of our plans.</p>
            <p style="text-align: center;">
              <a href="${frontendUrl}/app/subscription" class="button">Subscribe Now</a>
            </p>
            <p>Thank you for choosing our platform!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send custom plan request email
   */
  async sendCustomPlanRequestEmail(
    adminEmail: string,
    userEmail: string,
    details: string
  ): Promise<boolean> {
    const subject = "Custom Plan Request";
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Custom Plan Request</h2>
            <p>A user has requested information about a custom plan.</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>Details:</strong></p>
            <p>${details}</p>
            <p>Please contact the user to discuss their requirements.</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmationEmail(
    email: string,
    planName: string,
    endDate: Date,
    amount: number,
    currency: string
  ): Promise<boolean> {
    const subject = "Your Subscription Confirmation";
    const formattedDate = endDate.toLocaleDateString();
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);

    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Thank You for Your Subscription!</h2>
            <p>Hello,</p>
            <p>Your subscription to the <strong>${planName}</strong> plan has been confirmed.</p>
            <p><strong>Subscription Details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Amount: ${formattedAmount}</li>
              <li>Valid until: ${formattedDate}</li>
            </ul>
            <p>You now have full access to all features included in your subscription plan.</p>
            <p>Thank you for choosing our platform!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send subscription canceled email
   */
  async sendSubscriptionCanceledEmail(
    email: string,
    planName: string,
    endDate: Date
  ): Promise<boolean> {
    const subject = "Your Subscription Has Been Canceled";
    const formattedDate = endDate.toLocaleDateString();
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Your Subscription Has Been Canceled</h2>
            <p>Hello,</p>
            <p>Your subscription to the <strong>${planName}</strong> plan has been canceled.</p>
            <p>You will continue to have access to your subscription benefits until <strong>${formattedDate}</strong>.</p>
            <p>If you wish to resubscribe, you can do so at any time from your account.</p>
            <p style="text-align: center;">
              <a href="${frontendUrl}/app/subscription" class="button">View Subscription Plans</a>
            </p>
            <p>Thank you for using our platform!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send trial expired email
   */
  async sendTrialExpiredEmail(
    email: string,
    planName: string
  ): Promise<boolean> {
    const subject = "Your Free Trial Has Expired";
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Your Free Trial Has Expired</h2>
            <p>Hello,</p>
            <p>Your free trial of the <strong>${planName}</strong> plan has expired.</p>
            <p>To continue using our services, please subscribe to one of our plans.</p>
            <p style="text-align: center;">
              <a href="${frontendUrl}/app/subscription" class="button">Subscribe Now</a>
            </p>
            <p>Thank you for trying our platform!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send subscription renewal success email
   */
  async sendSubscriptionRenewalSuccessEmail(
    email: string,
    planName: string,
    amount: number,
    currency: string,
    nextPaymentDate: Date
  ): Promise<boolean> {
    const subject = "Subscription Renewed Successfully";
    const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    const formattedDate = nextPaymentDate.toLocaleDateString();
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          ul { background-color: white; padding: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Renewed!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your subscription to the <strong>${planName}</strong> plan has been renewed successfully.</p>
            <p><strong>Renewal Details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Amount: ${formattedAmount}</li>
              <li>Next payment date: ${formattedDate}</li>
            </ul>
            <p>Your service will continue uninterrupted. Thank you for your continued trust!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send subscription renewal failed email
   */
  async sendSubscriptionRenewalFailedEmail(
    email: string,
    planName: string,
    errorMessage: string,
    attemptNumber: number,
    maxAttempts: number
  ): Promise<boolean> {
    const subject = "Subscription Payment Failed";
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We were unable to process the payment for your <strong>${planName}</strong> subscription.</p>
            <div class="warning">
              <p><strong>Error:</strong> ${errorMessage}</p>
              <p><strong>Attempt:</strong> ${attemptNumber} of ${maxAttempts}</p>
            </div>
            <p>To avoid service interruption, please update your payment method or contact support.</p>
            <p><a href="${frontendUrl}/subscription" class="button">Update Payment Method</a></p>
            <p>If you continue to experience issues, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send subscription expired email
   */
  async sendSubscriptionExpiredEmail(
    email: string,
    planName: string
  ): Promise<boolean> {
    const subject = "Your Subscription Has Expired";
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expired</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your <strong>${planName}</strong> subscription has expired.</p>
            <p>Your access to premium features has been limited. To restore full access, please renew your subscription.</p>
            <p><a href="${frontendUrl}/subscription/plans" class="button">Renew Subscription</a></p>
            <p>Thank you for using our platform. We hope to serve you again soon!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send upcoming renewal notification email
   */
  async sendUpcomingRenewalNotificationEmail(
    email: string,
    planName: string,
    daysUntilRenewal: number,
    renewalDate: Date,
    amount: number,
    currency: string
  ): Promise<boolean> {
    const subject = `Your Subscription Renews in ${daysUntilRenewal} Days`;
    const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    const formattedDate = renewalDate.toLocaleDateString();
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          ul { background-color: white; padding: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This is a friendly reminder that your <strong>${planName}</strong> subscription will renew automatically in <strong>${daysUntilRenewal} days</strong>.</p>
            <p><strong>Renewal Details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Amount: ${formattedAmount}</li>
              <li>Renewal date: ${formattedDate}</li>
            </ul>
            <p>No action is required - your subscription will renew automatically. If you need to make changes, you can manage your subscription anytime.</p>
            <p><a href="${frontendUrl}/subscription" class="button">Manage Subscription</a></p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccessEmail(
    email: string,
    planName: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    const subject = "Payment Received Successfully";
    const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Success!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We have successfully processed your payment for the <strong>${planName}</strong> subscription.</p>
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Amount: ${formattedAmount}</li>
              <li>Date: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(
    email: string,
    planName: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    const subject = "Payment Failed";
    const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    const appName = this.configService.get<string>(
      "APP_NAME",
      "Restaurant Management System"
    );
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We were unable to process your payment for the <strong>${planName}</strong> subscription.</p>
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Amount: ${formattedAmount}</li>
              <li>Date: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>Please check your payment method and try again, or contact support for assistance.</p>
            <p><a href="${frontendUrl}/subscription" class="button">Update Payment</a></p>
          </div>
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}
