import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import { generateTokens } from '../services/jwt.service.js';
import { sendOtpEmail, sendPasswordResetOtpEmail } from '../services/email.service.js';
import { otpRateLimiter } from '../utils/otpRateLimiter.util.js';
import { validateEmail, validatePassword, validatePhoneNumber, validateName } from '../utils/validation.util.js';

const REFRESH_TOKEN_COOKIE_NAME = 'jid';

class AuthController {
  // ===========================
  // INFLUENCER SIGNUP
  // ===========================
  async influencerSignup(req: Request, res: Response) {
    try {
      const { name, email, password, phoneNo, acceptTerms } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, email, and password are required' });
      }

      // Check OTP rate limit
      const rateLimitCheck = otpRateLimiter.checkLimit(email);
      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetTime ? otpRateLimiter.formatTimeRemaining(rateLimitCheck.resetTime - Date.now()) : '15 minutes';
        return res.status(429).json({ 
          error: 'Too many OTP requests',
          message: `Too many OTP requests. Please try again in ${resetTime}.`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      // Require acceptance of legal terms
      if (acceptTerms !== true) {
        return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to sign up.' });
      }

      // Validate name
      const nameValidation = validateName(name, 'Name');
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
      }

      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.error });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      // Validate phone number if provided
      const phoneValidation = validatePhoneNumber(phoneNo);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: ({
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
        } as any),
        include: {
          influencer: true,
        },
      });

      // Delete any existing OTPs for this email
      await prisma.otp.deleteMany({ where: { email } });

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

      // Record OTP attempt
      otpRateLimiter.recordAttempt(email);

      // Send OTP email
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error('[AuthController.influencerSignup] Failed to send OTP email:', emailError);
        // Don't fail signup if email fails - user can resend
      }

      const { password: _, ...user } = newUser;
      return res.status(201).json({
        message: 'Influencer registered successfully. Please check your email for an OTP to verify your account.',
        userId: user.id,
        email: user.email,
        nextStep: 'VERIFY_EMAIL',
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target ?? [];
        if (target.includes('email')) return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('[AuthController.influencerSignup] Error:', error);
      return res.status(500).json({ error: 'Failed to register influencer' });
    }
  }

  // ===========================
  // VERIFY OTP (Handles both Influencer and Salon)
  // ===========================
  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      // Use transaction to prevent race conditions
      const result: 
        | { error: string; status: 400 | 404 }
        | { user: any; success: true } = await prisma.$transaction(async (tx) => {
        // Find and delete OTP in one atomic operation
        const otpEntry = await tx.otp.findUnique({
          where: { email_otp: { email, otp } },
        });

        if (!otpEntry) {
          return { error: 'Invalid OTP', status: 400 as const };
        }

        if (otpEntry.expiresAt < new Date()) {
          // OTP has expired, delete it
          await tx.otp.delete({ where: { id: otpEntry.id } });
          return { error: 'OTP has expired', status: 400 as const };
        }

        // Delete OTP immediately to prevent concurrent use
        await tx.otp.delete({ where: { id: otpEntry.id } });

        // Get user with related data
        const user = await tx.user.findUnique({ 
          where: { email },
          include: {
            influencer: true,
            salon: true,
          }
        });
        
        if (!user) {
          return { error: 'User not found', status: 404 as const };
        }

        // Update emailVerified based on user role
        if (user.role === Role.INFLUENCER && user.influencer) {
          await tx.influencer.update({
            where: { userId: user.id },
            data: { emailVerified: true },
          });
          user.influencer.emailVerified = true;
        } else if (user.role === Role.SALON && user.salon) {
          await tx.salon.update({
            where: { userId: user.id },
            data: { emailVerified: true },
          });
          user.salon.emailVerified = true;
        }

        return { user, success: true as const };
      });

      // Check for errors from transaction
      if ('error' in result && 'status' in result) {
        return res.status(result.status as number).json({ error: result.error });
      }

      if (!('user' in result)) {
        return res.status(500).json({ error: 'Unexpected error during OTP verification' });
      }

      const user = result.user;

      // Reset rate limit on successful verification
      otpRateLimiter.resetAttempts(email);

      // Return appropriate response based on role and next steps
      const response: any = { 
        message: 'Email verified successfully.',
        role: user.role,
        userId: user.id,
      };

      // For influencers: Go directly to login/onboarding
      if (user.role === Role.INFLUENCER && user.influencer) {
        response.influencerId = user.influencer.id;
        response.requiresPayment = false;
        response.nextStep = 'LOGIN';
        response.message = 'Email verified successfully. Please login to continue.';
      } 
      // For salons: Check if payment is completed
      else if (user.role === Role.SALON && user.salon) {
        response.salonId = user.salon.id;
        response.email = user.email;
        
        // Check payment status with multiple sources
        const hasActiveSubscription = await prisma.subscription.count({
          where: { 
            salonId: user.salon.id,
            status: { in: ['ACTIVE', 'TRIALING'] }
          }
        }) > 0;

        const hasCompletedPayment = await prisma.payment.count({
          where: { 
            salonId: user.salon.id,
            status: 'COMPLETED'
          }
        }) > 0;

        const paymentCompleted = hasActiveSubscription || hasCompletedPayment || user.salon.paymentCompleted;

        // Auto-fix payment flag if inconsistent
        if ((hasActiveSubscription || hasCompletedPayment) && !user.salon.paymentCompleted) {
          console.log(`[AuthController.verifyOtp] Auto-fixing payment flag for salon ${user.salon.id}`);
          await prisma.salon.update({
            where: { id: user.salon.id },
            data: { paymentCompleted: true }
          });
        }

        if (paymentCompleted) {
          // Payment already done, go to login
          response.requiresPayment = false;
          response.nextStep = 'LOGIN';
          response.message = 'Email verified successfully. Please login to continue.';
        } else {
          // Need to complete payment first
          response.requiresPayment = true;
          response.nextStep = 'PAYMENT';
          response.message = 'Email verified successfully. Please complete payment to continue.';
        }
      }

      return res.status(200).json(response);
    } catch (error: any) {
      console.error('[AuthController.verifyOtp] Error:', error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

  // ===========================
  // SALON SIGNUP
  // ===========================
  async salonSignup(req: Request, res: Response) {
    try {
      const { name, email, password, phoneNo, acceptTerms } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, email, and password are required' });
      }

      // Check OTP rate limit
      const rateLimitCheck = otpRateLimiter.checkLimit(email);
      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetTime ? otpRateLimiter.formatTimeRemaining(rateLimitCheck.resetTime - Date.now()) : '15 minutes';
        return res.status(429).json({ 
          error: 'Too many OTP requests',
          message: `Too many OTP requests. Please try again in ${resetTime}.`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      // Require acceptance of legal terms
      if (acceptTerms !== true) {
        return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to sign up.' });
      }

      // Validate name
      const nameValidation = validateName(name, 'Name');
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
      }

      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.error });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      // Validate phone number if provided
      const phoneValidation = validatePhoneNumber(phoneNo);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: ({
          name,
          email,
          password: hashedPassword,
          role: Role.SALON,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          salon: {
            create: {
              phoneNo,
              // Payment will be completed later, after email verification
              paymentCompleted: false,
            },
          },
        } as any),
        include: {
          salon: true,
        },
      });

      // Delete any existing OTPs for this email
      await prisma.otp.deleteMany({ where: { email } });

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

      // Record OTP attempt
      otpRateLimiter.recordAttempt(email);

      // Send OTP email
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error('[AuthController.salonSignup] Failed to send OTP email:', emailError);
        // Don't fail signup if email fails - user can resend
      }

      const { password: _, ...user } = newUser;
      return res.status(201).json({
        message: 'Salon registered successfully. Please check your email for an OTP to verify your account.',
        userId: user.id,
        salonId: user.salon?.id,
        email: user.email,
        // Don't redirect to payment yet - verify email first!
        nextStep: 'VERIFY_EMAIL',
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target ?? [];
        if (target.includes('email')) return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('[AuthController.salonSignup] Error:', error);
      return res.status(500).json({ error: 'Failed to register salon' });
    }
  }

  // ===========================
  // LOGIN
  // ===========================
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ 
        where: { email }, 
        include: { 
          influencer: true, 
          salon: {
            include: {
              subscriptions: {
                where: {
                  status: { in: ['ACTIVE', 'TRIALING'] }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
              },
              payments: {
                where: {
                  status: 'COMPLETED'
                },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        } 
      }) as any;

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Block login if terms not accepted
      if (!user.termsAccepted) {
        return res.status(403).json({ 
          error: 'TermsNotAccepted',
          code: 'TERMS_NOT_ACCEPTED',
          message: 'Please accept the Terms of Service and Privacy Policy to access your account.'
        });
      }

      // Enforce email verification before allowing login
      const isEmailVerified = user.role === 'INFLUENCER' 
        ? user.influencer?.emailVerified 
        : user.role === 'SALON' 
          ? user.salon?.emailVerified 
          : true;

      if (!isEmailVerified) {
        // Delete old OTPs and create a new one
        await prisma.otp.deleteMany({ where: { email } });
        
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        await prisma.otp.create({ data: { email, otp, expiresAt } });
        
        try {
          await sendOtpEmail(email, otp);
        } catch (emailError) {
          console.error('[AuthController.login] Failed to send OTP email:', emailError);
        }

        return res.status(403).json({
          error: 'EmailNotVerified',
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Your email is not verified. Please verify using the OTP sent to your email.',
          email,
        });
      }

      // Check if salon has completed payment (salons only)
      // More robust check: Look for active subscription OR completed payment OR paymentCompleted flag
      if (user.role === 'SALON' && user.salon) {
        const hasActiveSubscription = user.salon.subscriptions && user.salon.subscriptions.length > 0;
        const hasCompletedPayment = user.salon.payments && user.salon.payments.length > 0;
        const paymentCompletedFlag = user.salon.paymentCompleted;

        console.log(`[AuthController.login] Payment status check for salon ${user.salon.id}:`, {
          hasActiveSubscription,
          hasCompletedPayment,
          paymentCompletedFlag
        });

        // If they have an active subscription or completed payment but flag is not set, fix it
        if ((hasActiveSubscription || hasCompletedPayment) && !paymentCompletedFlag) {
          console.log(`[AuthController.login] Auto-fixing payment flag for salon ${user.salon.id}`);
          await prisma.salon.update({
            where: { id: user.salon.id },
            data: { paymentCompleted: true }
          });
          user.salon.paymentCompleted = true;
        }

        // Only block if NO payment method found AND email is verified
        // This ensures users complete: Signup → Verify Email → Payment → Onboarding
        if (!hasActiveSubscription && !hasCompletedPayment && !paymentCompletedFlag) {
          return res.status(403).json({
            error: 'PaymentRequired',
            code: 'PAYMENT_REQUIRED',
            message: 'Please complete payment to access your salon account.',
            salonId: user.salon.id,
            email: user.email,
            nextStep: 'PAYMENT',
          });
        }
      }

      const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        role: user.role,
      });

      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh-token',
      });

      // Check if user has completed onboarding
      let hasCompletedOnboarding = false;
      if (user.role === 'INFLUENCER') {
        hasCompletedOnboarding = !!user.influencer?.bio;
      } else if (user.role === 'SALON') {
        hasCompletedOnboarding = !!user.salon?.businessName;
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
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // ===========================
  // CHECK USER STATUS (For better UX flow)
  // ===========================
  async checkUserStatus(req: Request, res: Response) {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { 
          influencer: true, 
          salon: {
            include: {
              subscriptions: {
                where: { status: { in: ['ACTIVE', 'TRIALING'] } },
                take: 1
              },
              payments: {
                where: { status: 'COMPLETED' },
                take: 1
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ 
          exists: false,
          message: 'User not found' 
        });
      }

      const isEmailVerified = user.role === 'INFLUENCER' 
        ? user.influencer?.emailVerified 
        : user.role === 'SALON' 
          ? user.salon?.emailVerified 
          : true;

      let paymentCompleted = true;
      let hasOnboarded = false;

      if (user.role === 'SALON' && user.salon) {
        const hasActiveSubscription = user.salon.subscriptions && user.salon.subscriptions.length > 0;
        const hasCompletedPayment = user.salon.payments && user.salon.payments.length > 0;
        paymentCompleted = hasActiveSubscription || hasCompletedPayment || user.salon.paymentCompleted;
        hasOnboarded = !!user.salon.businessName;
      } else if (user.role === 'INFLUENCER' && user.influencer) {
        hasOnboarded = !!user.influencer.bio;
      }

      return res.status(200).json({
        exists: true,
        role: user.role,
        emailVerified: isEmailVerified,
        paymentCompleted,
        hasOnboarded,
        termsAccepted: user.termsAccepted,
        salonId: user.salon?.id,
        influencerId: user.influencer?.id
      });
    } catch (error: any) {
      console.error('[AuthController.checkUserStatus] Error:', error);
      return res.status(500).json({ error: 'Failed to check user status' });
    }
  }

  // ===========================
  // RESEND OTP
  // ===========================
  async resendOtp(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check OTP rate limit
      const rateLimitCheck = otpRateLimiter.checkLimit(email);
      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetTime ? otpRateLimiter.formatTimeRemaining(rateLimitCheck.resetTime - Date.now()) : '15 minutes';
        return res.status(429).json({ 
          error: 'Too many OTP requests',
          message: `Too many OTP requests. Please try again in ${resetTime}.`,
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimitCheck.resetTime
        });
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

      // Record OTP attempt
      otpRateLimiter.recordAttempt(email);

      // Send OTP email
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error('[AuthController.resendOtp] Failed to send OTP email:', emailError);
        return res.status(500).json({ 
          error: 'Failed to send OTP email',
          message: 'Could not send email. Please try again later.'
        });
      }

      return res.status(200).json({ 
        message: 'OTP resent successfully',
        remainingAttempts: rateLimitCheck.remainingAttempts 
      });
    } catch (error: any) {
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
  async forgotPassword(req: Request, res: Response) {
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
    } catch (error: any) {
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
  async verifyForgotPasswordOtp(req: Request, res: Response) {
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
    } catch (error: any) {
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
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
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
    } catch (error: any) {
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
  async resendForgotPasswordOtp(req: Request, res: Response) {
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
    } catch (error: any) {
      console.error('[AuthController.resendForgotPasswordOtp] Error:', error);
      return res.status(500).json({ error: 'Failed to resend OTP' });
    }
  }

}

export default new AuthController();
