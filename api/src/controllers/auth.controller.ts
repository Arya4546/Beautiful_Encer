import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import { generateTokens } from '../services/jwt.service.js';
import { sendOtpEmail } from '../services/email.service.js';

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
      } else if (user.role === Role.SALON && user.salon) {
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
            },
          },
        } as any),
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

  const user = await prisma.user.findUnique({ where: { email } }) as any;
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

      // Block login if terms not accepted
      if (!user.termsAccepted) {
        return res.status(403).json({ 
          error: 'TermsNotAccepted',
          code: 'TERMS_NOT_ACCEPTED',
          message: 'Please accept the Terms of Service and Privacy Policy to access your account.'
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
      } else if (user.role === 'SALON') {
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
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

}

export default new AuthController();
