import SibApiV3Sdk from "sib-api-v3-sdk";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.util.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Brevo API setup
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();
// Email configuration
const SENDER_EMAIL = process.env.EMAIL_FROM || "noreply@sutekibank.com";
const SENDER_NAME = process.env.EMAIL_FROM_NAME || "REAL MEDIA";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support_realmedia@sutekibank.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sutekibank.com";
// Template paths
const TEMPLATES_DIR = path.join(__dirname, "../templates/emails");
/**
 * Render EJS template with data
 */
const renderTemplate = async (templateName, data) => {
    const baseLayoutPath = path.join(TEMPLATES_DIR, "base-layout.ejs");
    const contentTemplatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);
    // Render the content template first
    const content = await ejs.renderFile(contentTemplatePath, data);
    // Render the base layout with the content
    const html = await ejs.renderFile(baseLayoutPath, {
        title: data.title || "REAL MEDIA",
        content,
        supportEmail: SUPPORT_EMAIL,
        currentYear: new Date().getFullYear(),
    });
    return html;
};
/**
 * Send email via Brevo
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const result = await tranEmailApi.sendTransacEmail({
            sender: { email: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ email: to }],
            subject,
            htmlContent,
        });
        logger.log(`✅ Email sent successfully to ${to}`);
        logger.log(`✅ Message ID: ${result.messageId}`);
        return result;
    }
    catch (error) {
        logger.error("❌ Failed to send email:", error);
        logger.error("❌ Error details:", {
            message: error.message,
            response: error.response?.text || error.response?.body,
            code: error.code,
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
};
// ===========================
// OTP & Authentication Emails
// ===========================
/**
 * Send OTP email for signup verification
 */
export const sendOtpEmail = async (to, otp, userName) => {
    logger.log(`📧 [Email Service] Sending OTP email to: ${to}`);
    logger.log(`📧 [Email Service] OTP Code: ${otp}`);
    const html = await renderTemplate("otp-verification", {
        title: "メール認証",
        userName: userName || "お客様",
        otp,
    });
    return sendEmail(to, "【REAL MEDIA】メール認証コードのご案内", html);
};
/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOtpEmail = async (to, otp, userName) => {
    logger.log(`🔐 [Email Service] Sending password reset OTP to: ${to}`);
    logger.log(`🔐 [Email Service] OTP Code: ${otp}`);
    const html = await renderTemplate("password-reset", {
        title: "パスワードリセット",
        userName: userName || "お客様",
        otp,
    });
    return sendEmail(to, "【REAL MEDIA】パスワードリセットのご案内", html);
};
// ===========================
// Registration Complete Emails
// ===========================
/**
 * Send registration complete email for influencers
 */
export const sendInfluencerRegistrationEmail = async (to, userName) => {
    logger.log(`📧 [Email Service] Sending influencer registration email to: ${to}`);
    const html = await renderTemplate("influencer-registration", {
        title: "インフルエンサー登録完了",
        userName,
        userEmail: to,
        loginUrl: `${FRONTEND_URL}/login`,
    });
    return sendEmail(to, "【REAL MEDIA】インフルエンサー登録完了のお知らせ", html);
};
/**
 * Send registration complete email for salons/clients
 */
export const sendSalonRegistrationEmail = async (to, businessName, contactName) => {
    logger.log(`📧 [Email Service] Sending salon registration email to: ${to}`);
    const html = await renderTemplate("salon-registration", {
        title: "クライアント登録完了",
        businessName,
        contactName,
        userEmail: to,
        loginUrl: `${FRONTEND_URL}/login`,
    });
    return sendEmail(to, "【REAL MEDIA】クライアント登録完了のお知らせ", html);
};
// ===========================
// Message Notification Emails
// ===========================
/**
 * Send new message notification to influencer (from salon)
 */
export const sendMessageNotificationToInfluencer = async (to, influencerName, salonName, messagePreview, conversationId) => {
    logger.log(`📧 [Email Service] Sending message notification to influencer: ${to}`);
    // Truncate message preview if too long
    const truncatedPreview = messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview;
    const html = await renderTemplate("new-message-to-influencer", {
        title: "新着メッセージ",
        userName: influencerName,
        salonName,
        messagePreview: truncatedPreview,
        chatUrl: `${FRONTEND_URL}/chat/${conversationId}`,
    });
    return sendEmail(to, "【REAL MEDIA】新しいメッセージが届きました", html);
};
/**
 * Send new message notification to salon (from influencer)
 */
export const sendMessageNotificationToSalon = async (to, businessName, influencerName, messagePreview, conversationId) => {
    logger.log(`📧 [Email Service] Sending message notification to salon: ${to}`);
    // Truncate message preview if too long
    const truncatedPreview = messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview;
    const html = await renderTemplate("new-message-to-salon", {
        title: "新着メッセージ",
        businessName,
        influencerName,
        messagePreview: truncatedPreview,
        chatUrl: `${FRONTEND_URL}/chat/${conversationId}`,
    });
    return sendEmail(to, "【REAL MEDIA】新しいメッセージが届きました", html);
};
// ===========================
// Request/Application Emails
// ===========================
/**
 * Send collaboration request notification to influencer (from salon)
 */
export const sendRequestNotificationToInfluencer = async (to, influencerName, salonName, projectName, requestMessage) => {
    logger.log(`📧 [Email Service] Sending request notification to influencer: ${to}`);
    const html = await renderTemplate("new-request-to-influencer", {
        title: "新しいリクエスト",
        userName: influencerName,
        salonName,
        projectName: projectName || null,
        requestMessage: requestMessage || null,
        requestUrl: `${FRONTEND_URL}/requests`,
    });
    return sendEmail(to, "【REAL MEDIA】新しいコラボリクエストが届きました", html);
};
/**
 * Send project application notification to salon (from influencer)
 */
export const sendApplicationNotificationToSalon = async (to, businessName, influencerName, projectName, applicationMessage) => {
    logger.log(`📧 [Email Service] Sending application notification to salon: ${to}`);
    const html = await renderTemplate("new-request-to-salon", {
        title: "新しい応募",
        businessName,
        influencerName,
        projectName,
        applicationMessage: applicationMessage || null,
        applicationUrl: `${FRONTEND_URL}/salon/projects`,
    });
    return sendEmail(to, `【REAL MEDIA】「${projectName}」に新しい応募がありました`, html);
};
// ===========================
// Payment & Subscription Emails
// ===========================
/**
 * Send subscription payment complete email
 */
export const sendSubscriptionPaymentEmail = async (to, businessName, planName, amount, paymentDate, nextBillingDate) => {
    logger.log(`📧 [Email Service] Sending subscription payment email to: ${to}`);
    const html = await renderTemplate("subscription-payment", {
        title: "お支払い完了",
        businessName,
        planName,
        amount,
        paymentDate,
        nextBillingDate,
        dashboardUrl: `${FRONTEND_URL}/salon/dashboard`,
    });
    return sendEmail(to, "【REAL MEDIA】お支払いが完了しました", html);
};
// ===========================
// Utility Functions
// ===========================
/**
 * Format date for Japanese email display
 */
export const formatDateJapanese = (date) => {
    return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};
/**
 * Test email connection (for health checks)
 */
export const testEmailConnection = async () => {
    try {
        // Brevo doesn't have a direct ping endpoint, but we can check if API key is configured
        if (!process.env.BREVO_API_KEY) {
            logger.warn("⚠️ BREVO_API_KEY not configured");
            return false;
        }
        logger.log("✅ Email service configured with Brevo");
        return true;
    }
    catch (error) {
        logger.error("❌ Email connection test failed:", error);
        return false;
    }
};
// Default export for backward compatibility
export default {
    sendOtpEmail,
    sendPasswordResetOtpEmail,
    sendInfluencerRegistrationEmail,
    sendSalonRegistrationEmail,
    sendMessageNotificationToInfluencer,
    sendMessageNotificationToSalon,
    sendRequestNotificationToInfluencer,
    sendApplicationNotificationToSalon,
    sendSubscriptionPaymentEmail,
    formatDateJapanese,
    testEmailConnection,
};
