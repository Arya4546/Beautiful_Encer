import SibApiV3Sdk from "sib-api-v3-sdk";
import logger from '../utils/logger.util.js';
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();
/**
 * Generate branded email HTML with magenta/purple theme
 */
const getEmailTemplate = (title, message, otp, purpose) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <!-- Main Container -->
            <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.98); border-radius: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden; backdrop-filter: blur(10px);">
              
              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #d946ef 0%, #a855f7 50%, #667eea 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    ✨ Beautiful Encer
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">
                    Influencer Marketing Platform
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                    ${title}
                  </h2>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    ${message}
                  </p>

                  <!-- OTP Box with Gradient Border -->
                  <div style="text-align: center; margin: 40px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #d946ef, #a855f7, #667eea); padding: 3px; border-radius: 16px; box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);">
                      <div style="background: white; border-radius: 14px; padding: 25px 50px;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Your OTP Code
                        </p>
                        <p style="margin: 0; font-size: 42px; font-weight: 700; letter-spacing: 8px; background: linear-gradient(135deg, #d946ef 0%, #a855f7 50%, #667eea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                          ${otp}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Warning -->
                  <div style="background: linear-gradient(135deg, rgba(217, 70, 239, 0.1), rgba(168, 85, 247, 0.1)); border-left: 4px solid #d946ef; border-radius: 8px; padding: 16px 20px; margin: 30px 0;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      ⏰ <strong style="color: #d946ef;">Important:</strong> This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                    </p>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you didn't request this ${purpose}, please ignore this email or contact our support team.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                    Best regards,
                  </p>
                  <p style="margin: 0; background: linear-gradient(135deg, #d946ef 0%, #a855f7 50%, #667eea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 16px; font-weight: 700;">
                    Team Beautiful Encer
                  </p>
                  
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      © 2025 Beautiful Encer. All rights reserved.<br>
                      This is an automated email. Please do not reply to this message.
                    </p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
/**
 * Send OTP email for signup verification
 */
export const sendOtpEmail = async (to, otp) => {
    const html = getEmailTemplate('Email Verification', 'Thank you for signing up with Beautiful Encer! To complete your registration, please verify your email address using the OTP code below:', otp, 'verification');
    try {
        logger.log(`📧 [Email Service] Sending OTP email to: ${to}`);
        logger.log(`📧 [Email Service] OTP Code: ${otp}`);
        const result = await tranEmailApi.sendTransacEmail({
            sender: { email: "singharya9693@gmail.com", name: "Beautiful Encer" },
            to: [{ email: to }],
            subject: "✨ Beautiful Encer - Verify Your Email",
            htmlContent: html,
        });
        logger.log(`✅ OTP email sent successfully to ${to}`);
        logger.log(`✅ Message ID: ${result.messageId}`);
        return result;
    }
    catch (error) {
        logger.error("❌ Failed to send OTP email:", error);
        logger.error("❌ Error details:", {
            message: error.message,
            response: error.response?.text || error.response?.body,
            code: error.code
        });
        throw new Error("Failed to send OTP email.");
    }
};
/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOtpEmail = async (to, otp) => {
    const html = getEmailTemplate('Password Reset Request', 'We received a request to reset your password. Use the OTP code below to proceed with resetting your password:', otp, 'password reset');
    try {
        logger.log(`🔐 [Email Service] Sending password reset OTP to: ${to}`);
        logger.log(`🔐 [Email Service] OTP Code: ${otp}`);
        const result = await tranEmailApi.sendTransacEmail({
            sender: { email: "singharya9693@gmail.com", name: "Beautiful Encer" },
            to: [{ email: to }],
            subject: "🔐 Beautiful Encer - Reset Your Password",
            htmlContent: html,
        });
        logger.log(`✅ Password reset OTP email sent successfully to ${to}`);
        logger.log(`✅ Message ID: ${result.messageId}`);
        return result;
    }
    catch (error) {
        logger.error("❌ Failed to send password reset OTP email:", error);
        logger.error("❌ Error details:", {
            message: error.message,
            response: error.response?.text || error.response?.body,
            code: error.code
        });
        throw new Error("Failed to send password reset OTP email.");
    }
};
