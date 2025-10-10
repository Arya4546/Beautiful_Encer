import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Beautiful Encer" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your OTP for Email Verification',
        html: `<p>Your One-Time Password is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to}`);
    }
    catch (error) {
        console.error(`Error sending OTP email to ${to}:`, error);
        throw new Error('Failed to send OTP email.');
    }
};
