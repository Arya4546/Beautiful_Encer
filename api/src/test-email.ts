// Test email sending functionality
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 Environment Check:');
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not Set');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not Set');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not Set');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not Set');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ Not Set');
console.log('');

// Try to send a test email
import SibApiV3Sdk from "sib-api-v3-sdk";

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const testEmail = async () => {
  try {
    console.log('📧 Attempting to send test email...');
    
    const result = await tranEmailApi.sendTransacEmail({
      sender: { email: "singharya9693@gmail.com", name: "Real Media" },
      to: [{ email: "singharya9693@gmail.com" }], // Change to your email
      subject: "🧪 Test Email - Real Media",
      htmlContent: `
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
    console.error('Response:', error.response?.text || error.response?.body);
  }
};

testEmail();
