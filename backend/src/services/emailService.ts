import nodemailer from 'nodemailer';
import config from '../config/index';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

const sendPasswordReset = async (to: string, resetLink: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Central Enterprises</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">You have requested to reset your password. Click the button below to create a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">This is an automated message from Central Enterprises. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Central Enterprises" <${config.smtpUser}>`,
    to,
    subject: 'Password Reset - Central Enterprises',
    html,
  });
};

const sendOrderUpdate = async (to: string, orderNumber: string, status: string, message: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Order Update</title></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
        <h2 style="color: #1f2937;">Order Update - ${orderNumber}</h2>
        <p style="color: #4b5563;">Status: <strong>${status}</strong></p>
        <p style="color: #4b5563;">${message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">Central Enterprises</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Central Enterprises" <${config.smtpUser}>`,
    to,
    subject: `Order Update - ${orderNumber}`,
    html,
  });
};

const sendNotification = async (to: string, subject: string, message: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
        <h2 style="color: #1f2937;">${subject}</h2>
        <p style="color: #4b5563;">${message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">Central Enterprises</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Central Enterprises" <${config.smtpUser}>`,
    to,
    subject,
    html,
  });
};

const sendInvoice = async (to: string, subject: string, pdfBuffer: Buffer): Promise<void> => {
  await transporter.sendMail({
    from: `"Central Enterprises" <${config.smtpUser}>`,
    to,
    subject,
    html: '<p>Please find attached your invoice.</p>',
    attachments: [
      {
        filename: `invoice-${Date.now()}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

export { sendPasswordReset, sendOrderUpdate, sendNotification, sendInvoice };
