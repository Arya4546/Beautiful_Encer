import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import logger from "../utils/logger.util.js";
import { prisma } from "../lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log SMTP configuration at startup (without sensitive data)
logger.log(`📧 [Email Service] Initializing with config:`);
logger.log(`   SMTP_HOST: ${process.env.SMTP_HOST || "smtp-relay.brevo.com"}`);
logger.log(`   SMTP_PORT: ${process.env.SMTP_PORT || "587"}`);
logger.log(`   SMTP_USER: ${process.env.SMTP_USER ? "✅ Set" : "❌ Not set"}`);
logger.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? "✅ Set" : process.env.BREVO_SMTP_KEY ? "✅ Set (BREVO_SMTP_KEY)" : "❌ Not set"}`);

// Nodemailer SMTP setup (using Brevo SMTP relay)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_FROM,
    pass: process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY,
  },
  // Increase timeouts for slow network connections (e.g., on Render)
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  // Enable connection pooling
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// Verify SMTP connection on startup (non-blocking)
transporter.verify()
  .then(() => {
    logger.log("✅ [Email Service] SMTP connection verified successfully");
  })
  .catch((error: any) => {
    logger.error("❌ [Email Service] SMTP connection verification failed:", error.message);
    logger.error("   Make sure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are correctly set in environment variables");
  });

// Email configuration
const SENDER_EMAIL = process.env.EMAIL_FROM || "noreply@sutekibank.com";
const SENDER_NAME = process.env.EMAIL_FROM_NAME || "REAL MEDIA";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support_realmedia@sutekibank.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sutekibank.com";

// Template paths - try multiple locations for dev vs production
const findTemplatesDir = (): string => {
  const possiblePaths = [
    path.join(__dirname, "../templates/emails"),  // dist/templates/emails (production)
    path.join(__dirname, "../../src/templates/emails"),  // src/templates/emails (from dist)
    path.resolve(process.cwd(), "src/templates/emails"),  // From project root (dev with tsx)
    path.resolve(process.cwd(), "dist/templates/emails"),  // From project root (production)
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      logger.log(`📁 [Email Service] Using templates directory: ${p}`);
      return p;
    }
  }
  
  logger.warn(`⚠️ [Email Service] Templates directory not found. Tried: ${possiblePaths.join(", ")}`);
  return possiblePaths[0]; // Default to first option
};

const TEMPLATES_DIR = findTemplatesDir();

// In-memory cache for message notification throttling
// Key: `${conversationId}:${recipientId}`, Value: last notification timestamp
const messageNotificationCache = new Map<string, Date>();

// Clean up old cache entries every hour
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [key, timestamp] of messageNotificationCache.entries()) {
    if (timestamp < oneDayAgo) {
      messageNotificationCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Check if email service is properly configured
 */
const isEmailServiceConfigured = (): boolean => {
  const hasAuth = !!(process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY);
  const hasUser = !!(process.env.SMTP_USER || process.env.EMAIL_FROM);
  return hasAuth && hasUser;
};

/**
 * Render EJS template with data
 * Returns null if template rendering fails (graceful degradation)
 */
const renderTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string | null> => {
  try {
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
  } catch (error: any) {
    logger.error(`❌ [Email Service] Template rendering failed for ${templateName}:`, error.message);
    return null;
  }
};

/**
 * Send email via Nodemailer SMTP (internal function)
 * @throws Error if email fails to send
 */
const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<any> => {
  if (!isEmailServiceConfigured()) {
    logger.warn("⚠️ [Email Service] SMTP credentials not configured, skipping email");
    return null;
  }

  if (!to || !subject || !htmlContent) {
    logger.error("❌ [Email Service] Missing required email parameters");
    throw new Error("Missing required email parameters");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    logger.error(`❌ [Email Service] Invalid email address: ${to}`);
    throw new Error(`Invalid email address: ${to}`);
  }

  try {
    const result = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });

    logger.log(`✅ Email sent successfully to ${to} (messageId: ${result.messageId})`);
    return result;
  } catch (error: any) {
    logger.error("❌ Failed to send email:", error);
    logger.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Fire-and-forget email sending (for non-critical emails)
 * Logs errors but doesn't throw
 */
const sendEmailFireAndForget = (
  to: string,
  subject: string,
  htmlContent: string
): void => {
  // Don't await - fire and forget
  sendEmail(to, subject, htmlContent).catch((error) => {
    logger.error(`❌ [Email Service] Fire-and-forget email failed to ${to}:`, error.message);
  });
};

// ===========================
// OTP & Authentication Emails (CRITICAL - must await)
// ===========================

/**
 * Send OTP email for signup verification
 * CRITICAL: This must be awaited as user needs OTP to proceed
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  userName?: string
): Promise<any> => {
  if (!to || !otp) {
    logger.error("❌ [Email Service] sendOtpEmail: Missing required parameters");
    throw new Error("Email and OTP are required");
  }

  logger.log(`📧 [Email Service] Sending OTP email to: ${to}`);

  const html = await renderTemplate("otp-verification", {
    title: "メール認証",
    userName: userName || "お客様",
    otp,
  });

  if (!html) {
    throw new Error("Failed to render OTP email template");
  }

  return sendEmail(to, "【REAL MEDIA】メール認証コードのご案内", html);
};

/**
 * Send OTP email for password reset
 * CRITICAL: This must be awaited as user needs OTP to proceed
 */
export const sendPasswordResetOtpEmail = async (
  to: string,
  otp: string,
  userName?: string
): Promise<any> => {
  if (!to || !otp) {
    logger.error("❌ [Email Service] sendPasswordResetOtpEmail: Missing required parameters");
    throw new Error("Email and OTP are required");
  }

  logger.log(`🔐 [Email Service] Sending password reset OTP to: ${to}`);

  const html = await renderTemplate("password-reset", {
    title: "パスワードリセット",
    userName: userName || "お客様",
    otp,
  });

  if (!html) {
    throw new Error("Failed to render password reset email template");
  }

  return sendEmail(to, "【REAL MEDIA】パスワードリセットのご案内", html);
};

// ===========================
// Registration Complete Emails (Fire-and-forget)
// ===========================

/**
 * Send registration complete email for influencers
 * Fire-and-forget: Registration is already complete, email is just confirmation
 */
export const sendInfluencerRegistrationEmail = (
  to: string,
  userName: string
): void => {
  if (!to || !userName) {
    logger.warn("⚠️ [Email Service] sendInfluencerRegistrationEmail: Missing parameters, skipping");
    return;
  }

  logger.log(`📧 [Email Service] Queuing influencer registration email to: ${to}`);

  renderTemplate("influencer-registration", {
    title: "インフルエンサー登録完了",
    userName,
    userEmail: to,
    loginUrl: `${FRONTEND_URL}/login`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, "【REAL MEDIA】インフルエンサー登録完了のお知らせ", html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render influencer registration email:`, error.message);
  });
};

/**
 * Send registration complete email for salons/clients
 * Fire-and-forget: Registration is already complete, email is just confirmation
 */
export const sendSalonRegistrationEmail = (
  to: string,
  businessName: string,
  contactName: string
): void => {
  if (!to || !businessName) {
    logger.warn("⚠️ [Email Service] sendSalonRegistrationEmail: Missing parameters, skipping");
    return;
  }

  logger.log(`📧 [Email Service] Queuing salon registration email to: ${to}`);

  renderTemplate("salon-registration", {
    title: "クライアント登録完了",
    businessName,
    contactName: contactName || businessName,
    userEmail: to,
    loginUrl: `${FRONTEND_URL}/login`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, "【REAL MEDIA】クライアント登録完了のお知らせ", html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render salon registration email:`, error.message);
  });
};

// ===========================
// Message Notification Emails (Smart throttling)
// ===========================

/**
 * Check if we should send message notification email
 * Only sends if:
 * 1. This is the first message of the day for this conversation/recipient
 * 2. Recipient is not currently online (check via socket)
 * 3. Recipient hasn't read messages in the conversation recently
 */
const shouldSendMessageNotification = async (
  conversationId: string,
  recipientId: string
): Promise<boolean> => {
  const cacheKey = `${conversationId}:${recipientId}`;
  const lastNotification = messageNotificationCache.get(cacheKey);
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // If we already sent a notification today for this conversation, skip
  if (lastNotification && lastNotification >= startOfDay) {
    logger.log(`📧 [Email Service] Skipping message notification - already sent today for conversation ${conversationId}`);
    return false;
  }

  // Check if recipient has read messages recently (within last 5 minutes)
  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: recipientId,
        },
      },
    });

    if (participant?.lastReadAt) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (participant.lastReadAt > fiveMinutesAgo) {
        logger.log(`📧 [Email Service] Skipping message notification - recipient recently active`);
        return false;
      }
    }
  } catch (error) {
    // If check fails, proceed with sending (better to over-notify than miss)
    logger.warn(`⚠️ [Email Service] Could not check recipient activity:`, error);
  }

  return true;
};

/**
 * Record that a message notification was sent
 */
const recordMessageNotification = (conversationId: string, recipientId: string): void => {
  const cacheKey = `${conversationId}:${recipientId}`;
  messageNotificationCache.set(cacheKey, new Date());
};

/**
 * Send new message notification to influencer (from salon)
 * Smart throttling: Only sends first notification of the day per conversation
 * Fire-and-forget: Message is already delivered via socket
 */
export const sendMessageNotificationToInfluencer = async (
  to: string,
  influencerName: string,
  salonName: string,
  messagePreview: string,
  conversationId: string,
  recipientId?: string
): Promise<void> => {
  if (!to || !conversationId) {
    logger.warn("⚠️ [Email Service] sendMessageNotificationToInfluencer: Missing required parameters");
    return;
  }

  // Use recipientId for throttling if provided
  const throttleKey = recipientId || to;
  
  // Check if we should send
  const shouldSend = await shouldSendMessageNotification(conversationId, throttleKey);
  if (!shouldSend) {
    return;
  }

  logger.log(`📧 [Email Service] Sending message notification to influencer: ${to}`);

  // Truncate message preview if too long
  const truncatedPreview = messagePreview 
    ? (messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview)
    : "新しいメッセージが届きました";

  try {
    const html = await renderTemplate("new-message-to-influencer", {
      title: "新着メッセージ",
      userName: influencerName || "インフルエンサー",
      salonName: salonName || "サロン",
      messagePreview: truncatedPreview,
      chatUrl: `${FRONTEND_URL}/chat/${conversationId}`,
    });

    if (html) {
      // Record before sending to prevent race conditions
      recordMessageNotification(conversationId, throttleKey);
      sendEmailFireAndForget(to, "【REAL MEDIA】新しいメッセージが届きました", html);
    }
  } catch (error: any) {
    logger.error(`❌ [Email Service] Failed to send message notification to influencer:`, error.message);
  }
};

/**
 * Send new message notification to salon (from influencer)
 * Smart throttling: Only sends first notification of the day per conversation
 * Fire-and-forget: Message is already delivered via socket
 */
export const sendMessageNotificationToSalon = async (
  to: string,
  businessName: string,
  influencerName: string,
  messagePreview: string,
  conversationId: string,
  recipientId?: string
): Promise<void> => {
  if (!to || !conversationId) {
    logger.warn("⚠️ [Email Service] sendMessageNotificationToSalon: Missing required parameters");
    return;
  }

  // Use recipientId for throttling if provided
  const throttleKey = recipientId || to;
  
  // Check if we should send
  const shouldSend = await shouldSendMessageNotification(conversationId, throttleKey);
  if (!shouldSend) {
    return;
  }

  logger.log(`📧 [Email Service] Sending message notification to salon: ${to}`);

  // Truncate message preview if too long
  const truncatedPreview = messagePreview 
    ? (messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview)
    : "新しいメッセージが届きました";

  try {
    const html = await renderTemplate("new-message-to-salon", {
      title: "新着メッセージ",
      businessName: businessName || "サロン",
      influencerName: influencerName || "インフルエンサー",
      messagePreview: truncatedPreview,
      chatUrl: `${FRONTEND_URL}/chat/${conversationId}`,
    });

    if (html) {
      // Record before sending to prevent race conditions
      recordMessageNotification(conversationId, throttleKey);
      sendEmailFireAndForget(to, "【REAL MEDIA】新しいメッセージが届きました", html);
    }
  } catch (error: any) {
    logger.error(`❌ [Email Service] Failed to send message notification to salon:`, error.message);
  }
};

// ===========================
// Request/Application Emails (Fire-and-forget)
// ===========================

/**
 * Send collaboration request notification to influencer (from salon)
 * Fire-and-forget: In-app notification already sent
 */
export const sendRequestNotificationToInfluencer = (
  to: string,
  influencerName: string,
  salonName: string,
  projectName?: string,
  requestMessage?: string
): void => {
  if (!to) {
    logger.warn("⚠️ [Email Service] sendRequestNotificationToInfluencer: Missing email");
    return;
  }

  logger.log(`📧 [Email Service] Queuing request notification to influencer: ${to}`);

  renderTemplate("new-request-to-influencer", {
    title: "新しいリクエスト",
    userName: influencerName || "インフルエンサー",
    salonName: salonName || "サロン",
    projectName: projectName || null,
    requestMessage: requestMessage || null,
    requestUrl: `${FRONTEND_URL}/requests`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, "【REAL MEDIA】新しいコラボリクエストが届きました", html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render request notification:`, error.message);
  });
};

/**
 * Send connection request notification to salon (from influencer)
 * Fire-and-forget: In-app notification already sent
 */
export const sendRequestNotificationToSalon = (
  to: string,
  businessName: string,
  influencerName: string,
  projectName?: string,
  requestMessage?: string
): void => {
  if (!to) {
    logger.warn("⚠️ [Email Service] sendRequestNotificationToSalon: Missing email");
    return;
  }

  logger.log(`📧 [Email Service] Queuing request notification to salon: ${to}`);

  renderTemplate("new-request-to-salon", {
    title: "新しいリクエスト",
    businessName: businessName || "サロン",
    influencerName: influencerName || "インフルエンサー",
    projectName: projectName || null,
    applicationMessage: requestMessage || null,
    applicationUrl: `${FRONTEND_URL}/salon/connections`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, "【REAL MEDIA】新しいコネクションリクエストが届きました", html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render request notification to salon:`, error.message);
  });
};

/**
 * Send project application notification to salon (from influencer)
 * Fire-and-forget: In-app notification already sent
 */
export const sendApplicationNotificationToSalon = (
  to: string,
  businessName: string,
  influencerName: string,
  projectName: string,
  applicationMessage?: string
): void => {
  if (!to || !projectName) {
    logger.warn("⚠️ [Email Service] sendApplicationNotificationToSalon: Missing required parameters");
    return;
  }

  logger.log(`📧 [Email Service] Queuing application notification to salon: ${to}`);

  renderTemplate("new-request-to-salon", {
    title: "新しい応募",
    businessName: businessName || "サロン",
    influencerName: influencerName || "インフルエンサー",
    projectName,
    applicationMessage: applicationMessage || null,
    applicationUrl: `${FRONTEND_URL}/salon/projects`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, `【REAL MEDIA】「${projectName}」に新しい応募がありました`, html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render application notification:`, error.message);
  });
};

// ===========================
// Payment & Subscription Emails (Fire-and-forget)
// ===========================

/**
 * Send subscription payment complete email
 * Fire-and-forget: Payment is already processed
 */
export const sendSubscriptionPaymentEmail = (
  to: string,
  businessName: string,
  planName: string,
  amount: number,
  paymentDate: string,
  nextBillingDate: string
): void => {
  if (!to || !planName) {
    logger.warn("⚠️ [Email Service] sendSubscriptionPaymentEmail: Missing required parameters");
    return;
  }

  logger.log(`📧 [Email Service] Queuing subscription payment email to: ${to}`);

  renderTemplate("subscription-payment", {
    title: "お支払い完了",
    businessName: businessName || "サロン",
    planName,
    amount: amount || 0,
    paymentDate: paymentDate || formatDateJapanese(new Date()),
    nextBillingDate: nextBillingDate || "未定",
    dashboardUrl: `${FRONTEND_URL}/salon/dashboard`,
  }).then((html) => {
    if (html) {
      sendEmailFireAndForget(to, "【REAL MEDIA】お支払いが完了しました", html);
    }
  }).catch((error) => {
    logger.error(`❌ [Email Service] Failed to render subscription payment email:`, error.message);
  });
};

// ===========================
// Utility Functions
// ===========================

/**
 * Format date for Japanese email display
 */
export const formatDateJapanese = (date: Date): string => {
  try {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

/**
 * Test email connection (for health checks)
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    if (!isEmailServiceConfigured()) {
      logger.warn("⚠️ SMTP credentials not configured");
      return false;
    }
    // Verify SMTP connection
    await transporter.verify();
    logger.log("✅ Email service configured with Nodemailer SMTP");
    return true;
  } catch (error) {
    logger.error("❌ Email connection test failed:", error);
    return false;
  }
};

/**
 * Clear message notification cache for a specific conversation
 * Useful when user views the conversation
 */
export const clearMessageNotificationCache = (conversationId: string, userId: string): void => {
  const cacheKey = `${conversationId}:${userId}`;
  messageNotificationCache.delete(cacheKey);
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
  sendRequestNotificationToSalon,
  sendApplicationNotificationToSalon,
  sendSubscriptionPaymentEmail,
  formatDateJapanese,
  testEmailConnection,
  clearMessageNotificationCache,
};
