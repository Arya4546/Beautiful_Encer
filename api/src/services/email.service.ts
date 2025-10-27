import SibApiV3Sdk from "sib-api-v3-sdk";

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendOtpEmail = async (to: string, otp: string) => {
  const html = `
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
    await tranEmailApi.sendTransacEmail({
      sender: { email: "9a28c3001@smtp-brevo.com", name: "Beautiful Encer" },
      to: [{ email: to }],
      subject: "Your OTP for Email Verification",
      htmlContent: html,
    });

    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }
};
