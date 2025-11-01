import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import { generateTokens } from '../services/jwt.service.js';
import { sendOtpEmail, sendPasswordResetOtpEmail } from '../services/email.service.js';
const REFRESH_TOKEN_COOKIE_NAME = 'jid';
class AuthController {
    // ===========================
    // INFLUENCER SIGNUP
    // ===========================
    async influencerSignup(req, res) {
        try {
            const { name, email, password, phoneNo, acceptTerms } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields: name, email, and password are required' });
            }
            // Require acceptance of legal terms
            if (acceptTerms !== true) {
                return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to sign up.' });
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Validate password strength (min 8 characters)
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: Role.INFLUENCER,
                    termsAccepted: true,
                    termsAcceptedAt: new Date(),
                    influencer: {
                        create: {
                            phoneNo,
                        },
                    },
                },
                include: {
                    influencer: true,
                },
            });
            // Generate OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await prisma.otp.create({
                data: {
                    email,
                    otp,
                    expiresAt,
                },
            });
            // Send OTP email
            await sendOtpEmail(email, otp);
            const { password: _, ...user } = newUser;
            return res.status(201).json({
                message: 'Influencer registered successfully. Please check your email for an OTP to verify your account.',
                userId: user.id,
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta?.target ?? [];
                if (target.includes('email'))
                    return res.status(409).json({ error: 'Email already exists' });
            }
            console.error('[AuthController.influencerSignup] Error:', error);
            return res.status(500).json({ error: 'Failed to register influencer' });
        }
    }
    // ===========================
    // VERIFY OTP (Handles both Influencer and Salon)
    // ===========================
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }
            const otpEntry = await prisma.otp.findUnique({
                where: { email_otp: { email, otp } },
            });
            if (!otpEntry) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }
            if (otpEntry.expiresAt < new Date()) {
                // OTP has expired, delete it
                await prisma.otp.delete({ where: { id: otpEntry.id } });
                return res.status(400).json({ error: 'OTP has expired' });
            }
            // OTP is valid, update user and delete OTP
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    influencer: true,
                    salon: true,
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Update emailVerified based on user role
            if (user.role === Role.INFLUENCER && user.influencer) {
                await prisma.influencer.update({
                    where: { userId: user.id },
                    data: { emailVerified: true },
                });
            }
            else if (user.role === Role.SALON && user.salon) {
                await prisma.salon.update({
                    where: { userId: user.id },
                    data: { emailVerified: true },
                });
            }
            await prisma.otp.delete({ where: { id: otpEntry.id } });
            return res.status(200).json({
                message: 'Email verified successfully. Please complete your onboarding.',
                role: user.role
            });
        }
        catch (error) {
            console.error('[AuthController.verifyOtp] Error:', error);
            return res.status(500).json({ error: 'Failed to verify OTP' });
        }
    }
    // ===========================
    // SALON SIGNUP
    // ===========================
    async salonSignup(req, res) {
        try {
            const { name, email, password, phoneNo, acceptTerms } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields: name, email, and password are required' });
            }
            // Require acceptance of legal terms
            if (acceptTerms !== true) {
                return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to sign up.' });
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Validate password strength (min 8 characters)
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: Role.SALON,
                    termsAccepted: true,
                    termsAcceptedAt: new Date(),
                    salon: {
                        create: {
                            phoneNo,
                        },
                    },
                },
                include: {
                    salon: true,
                },
            });
            // Generate OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await prisma.otp.create({
                data: {
                    email,
                    otp,
                    expiresAt,
                },
            });
            // Send OTP email
            await sendOtpEmail(email, otp);
            const { password: _, ...user } = newUser;
            return res.status(201).json({
                message: 'Salon registered successfully. Please check your email for an OTP to verify your account.',
                userId: user.id,
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta?.target ?? [];
                if (target.includes('email'))
                    return res.status(409).json({ error: 'Email already exists' });
            }
            console.error('[AuthController.salonSignup] Error:', error);
            return res.status(500).json({ error: 'Failed to register salon' });
        }
    }
    // ===========================
    // LOGIN
    // ===========================
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            const user = await prisma.user.findUnique({ where: { email }, include: { influencer: true, salon: true } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid)
                return res.status(401).json({ error: 'Invalid credentials' });
            // Block login if terms not accepted
            if (!user.termsAccepted) {
                return res.status(403).json({
                    error: 'TermsNotAccepted',
                    code: 'TERMS_NOT_ACCEPTED',
                    message: 'Please accept the Terms of Service and Privacy Policy to access your account.'
                });
            }
            // Enforce email verification before allowing login
            const isEmailVerified = user.role === 'INFLUENCER' ? user.influencer?.emailVerified : user.role === 'SALON' ? user.salon?.emailVerified : true;
            if (!isEmailVerified) {
                // Optionally auto re-issue OTP if none exists or expired
                try {
                    const existingOtp = await prisma.otp.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
                    const shouldIssueNew = !existingOtp || existingOtp.expiresAt < new Date();
                    if (shouldIssueNew) {
                        const otp = crypto.randomInt(100000, 999999).toString();
                        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                        await prisma.otp.create({ data: { email, otp, expiresAt } });
                        await sendOtpEmail(email, otp);
                    }
                }
                catch (e) {
                    console.warn('[AuthController.login] Failed to auto-issue OTP:', e);
                }
                return res.status(403).json({
                    error: 'EmailNotVerified',
                    code: 'EMAIL_NOT_VERIFIED',
                    message: 'Your email is not verified. Please verify using the OTP sent to your email.',
                    email,
                });
            }
            const { accessToken, refreshToken } = generateTokens({
                userId: user.id,
                role: user.role,
            });
            res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // only send over https
                sameSite: 'strict',
                path: '/auth/refresh-token', // be specific about the path
            });
            // Check if user has completed onboarding
            let hasCompletedOnboarding = false;
            if (user.role === 'INFLUENCER') {
                const influencer = await prisma.influencer.findUnique({
                    where: { userId: user.id },
                });
                hasCompletedOnboarding = !!influencer?.bio; // If bio exists, onboarding is complete
            }
            else if (user.role === 'SALON') {
                const salon = await prisma.salon.findUnique({
                    where: { userId: user.id },
                });
                hasCompletedOnboarding = !!salon?.businessName; // If businessName exists, onboarding is complete
            }
            const { password: _, ...userData } = user;
            return res.status(200).json({
                message: 'Login successful',
                accessToken,
                user: {
                    ...userData,
                    hasCompletedOnboarding,
                },
            });
        }
        catch (error) {
            console.error('[AuthController.login] Error:', error);
            return res.status(500).json({ error: 'Login failed' });
        }
    }
    // ===========================
    // RESEND OTP
    // ===========================
    async resendOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            const user = await prisma.user.findUnique({ where: { email }, include: { influencer: true, salon: true } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const isVerified = user.role === 'INFLUENCER' ? user.influencer?.emailVerified : user.role === 'SALON' ? user.salon?.emailVerified : true;
            if (isVerified) {
                return res.status(400).json({ error: 'Email already verified' });
            }
            // Invalidate existing OTPs for this email (optional cleanup)
            await prisma.otp.deleteMany({ where: { email } });
            // Create new OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await prisma.otp.create({ data: { email, otp, expiresAt } });
            await sendOtpEmail(email, otp);
            return res.status(200).json({ message: 'OTP resent successfully' });
        }
        catch (error) {
            console.error('[AuthController.resendOtp] Error:', error);
            return res.status(500).json({ error: 'Failed to resend OTP' });
        }
    }
    // ===========================
    // FORGOT PASSWORD
    // ===========================
    /**
     * Step 1: Request forgot password - Send OTP to email
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    influencer: true,
                    salon: true,
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'No account found with this email address' });
            }
            // Delete existing OTPs for this email
            await prisma.otp.deleteMany({ where: { email } });
            // Generate new OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await prisma.otp.create({
                data: {
                    email,
                    otp,
                    expiresAt,
                },
            });
            // Send OTP email
            await sendPasswordResetOtpEmail(email, otp);
            return res.status(200).json({
                message: 'Password reset OTP sent to your email',
                email
            });
        }
        catch (error) {
            console.error('[AuthController.forgotPassword] Error:', error);
            return res.status(500).json({
                error: 'Failed to process forgot password request',
                message: error.message
            });
        }
    }
    /**
     * Step 2: Verify OTP for password reset
     */
    async verifyForgotPasswordOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }
            // Find OTP record
            const otpRecord = await prisma.otp.findUnique({
                where: { email_otp: { email, otp } },
            });
            if (!otpRecord) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }
            // Check if OTP expired
            if (new Date() > otpRecord.expiresAt) {
                await prisma.otp.delete({ where: { id: otpRecord.id } });
                return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
            }
            // OTP is valid - keep it for the reset password step
            return res.status(200).json({
                message: 'OTP verified successfully',
                email
            });
        }
        catch (error) {
            console.error('[AuthController.verifyForgotPasswordOtp] Error:', error);
            return res.status(500).json({
                error: 'Failed to verify OTP',
                message: error.message
            });
        }
    }
    /**
     * Step 3: Reset password with verified email and OTP
     */
    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) {
                return res.status(400).json({ error: 'Email, OTP, and new password are required' });
            }
            // Validate password strength
            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long' });
            }
            // Verify OTP one more time
            const otpRecord = await prisma.otp.findUnique({
                where: { email_otp: { email, otp } },
            });
            if (!otpRecord) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }
            if (new Date() > otpRecord.expiresAt) {
                await prisma.otp.delete({ where: { id: otpRecord.id } });
                return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
            }
            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            // Update password
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword },
            });
            // Delete used OTP
            await prisma.otp.delete({ where: { id: otpRecord.id } });
            return res.status(200).json({
                message: 'Password reset successfully. You can now log in with your new password.'
            });
        }
        catch (error) {
            console.error('[AuthController.resetPassword] Error:', error);
            return res.status(500).json({
                error: 'Failed to reset password',
                message: error.message
            });
        }
    }
    /**
     * Resend OTP for forgot password
     */
    async resendForgotPasswordOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res.status(404).json({ error: 'No account found with this email address' });
            }
            // Delete existing OTPs
            await prisma.otp.deleteMany({ where: { email } });
            // Generate new OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await prisma.otp.create({
                data: { email, otp, expiresAt },
            });
            // Send OTP email
            await sendPasswordResetOtpEmail(email, otp);
            return res.status(200).json({ message: 'OTP resent successfully' });
        }
        catch (error) {
            console.error('[AuthController.resendForgotPasswordOtp] Error:', error);
            return res.status(500).json({ error: 'Failed to resend OTP' });
        }
    }
}
export default new AuthController();
