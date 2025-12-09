// Test email sending functionality
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 Environment Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp-relay.brevo.com (default)');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : (process.env.EMAIL_FROM ? `✅ Using EMAIL_FROM: ${process.env.EMAIL_FROM}` : '❌ Not Set'));
console.log('SMTP_PASS:', process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY ? '✅ Set' : '❌ Not Set');
console.log('');

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_FROM,
    pass: process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY,
  },
});

const testEmail = async () => {
  try {
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
    
    console.log('📧 Attempting to send test email...');
    
    const result = await transporter.sendMail({
      from: `"Real Media" <${process.env.EMAIL_FROM || "noreply@sutekibank.com"}>`,
      to: "singharya9693@gmail.com", // Change to your email
      subject: "🧪 Test Email - Real Media",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #d946ef;">Test Email</h1>
            <p>This is a test email from Real Media OTP system.</p>
            <p><strong>Test OTP:</strong> 123456</p>
            <p>If you received this, your email service is working correctly! ✅</p>
          </body>
        </html>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error: any) {
    console.error('❌ Failed to send email:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
  }
};

testEmail();
