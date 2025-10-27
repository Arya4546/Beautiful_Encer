import nodemailer from "nodemailer";
import { Resend } from "resend";
const isProduction = process.env.NODE_ENV === "production";
// ✅ Setup for Resend (production)
const resend = new Resend(process.env.RESEND_API_KEY);
// ✅ Setup for Nodemailer (local)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
/**
 * Send OTP Email — Automatically chooses between Nodemailer (local) and Resend (production)
 */
export const sendOtpEmail = async (to, otp) => {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #333;">Beautiful Encer - OTP Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="background: #f5f5f5; display: inline-block; padding: 10px 20px; border-radius: 5px;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <br/>
      <p>— Team Beautiful Encer</p>
    </div>
  `;
    try {
        if (isProduction) {
            // 🟢 Use Resend on Render (SMTP blocked)
            await resend.emails.send({
                from: "Beautiful Encer <onboarding@resend.dev>",
                to,
                subject: "Your OTP for Email Verification",
                html: htmlContent,
            });
            console.log(`✅ OTP email sent to ${to} via Resend`);
        }
        else {
            // 🟡 Use Gmail locally for testing
            await transporter.sendMail({
                from: `"Beautiful Encer" <${process.env.EMAIL_USER}>`,
                to,
                subject: "Your OTP for Email Verification",
                html: htmlContent,
            });
            console.log(`✅ OTP email sent to ${to} via Nodemailer`);
        }
    }
    catch (error) {
        console.error(`❌ Error sending OTP email to ${to}:`, error);
        throw new Error("Failed to send OTP email.");
    }
};
