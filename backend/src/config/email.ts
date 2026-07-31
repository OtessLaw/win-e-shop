import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'JJ Vintage Collection <noreply@jjvintage.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

/** Email templates */
export const emailTemplates = {
  welcomeEmail: (name: string, verifyUrl: string): string => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #000000; padding: 30px; text-align: center;">
        <h1 style="color: #C9A227; margin: 0; font-size: 28px; letter-spacing: 3px;">JJ VINTAGE COLLECTION</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #000; font-size: 22px;">Welcome, ${name}! 🎉</h2>
        <p style="color: #555; line-height: 1.8;">Thank you for creating an account with JJ Vintage Collection. Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #000; color: #C9A227; padding: 14px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">VERIFY EMAIL</a>
        <p style="color: #888; font-size: 13px;">This link expires in 24 hours. If you did not create this account, please ignore this email.</p>
      </div>
      <div style="background: #f8f8f8; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">© 2024 JJ Vintage Collection. All Rights Reserved.</p>
      </div>
    </div>
  `,

  passwordReset: (name: string, resetUrl: string): string => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #000000; padding: 30px; text-align: center;">
        <h1 style="color: #C9A227; margin: 0; font-size: 28px; letter-spacing: 3px;">JJ VINTAGE COLLECTION</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #000; font-size: 22px;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.8;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #000; color: #C9A227; padding: 14px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">RESET PASSWORD</a>
        <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
      </div>
      <div style="background: #f8f8f8; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">© 2024 JJ Vintage Collection. All Rights Reserved.</p>
      </div>
    </div>
  `,

  orderConfirmation: (name: string, orderId: string, total: string): string => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #000000; padding: 30px; text-align: center;">
        <h1 style="color: #C9A227; margin: 0; font-size: 28px; letter-spacing: 3px;">JJ VINTAGE COLLECTION</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #000; font-size: 22px;">Order Confirmed! ✅</h2>
        <p style="color: #555; line-height: 1.8;">Hi ${name}, your order <strong>#${orderId}</strong> has been confirmed. Total: <strong>GHS ${total}</strong></p>
        <p style="color: #555;">We'll notify you when your order is shipped.</p>
      </div>
      <div style="background: #f8f8f8; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">© 2024 JJ Vintage Collection. All Rights Reserved.</p>
      </div>
    </div>
  `,
};
