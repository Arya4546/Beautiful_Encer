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
      const { name, email, password, phoneNo, socialMediaLink } = req.body;

      if (!name || !email || !password || !socialMediaLink) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: Role.INFLUENCER,
          influencer: {
            create: {
              phoneNo,
              socialMediaLink,
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
        message: 'Influencer registered. Please check your email for an OTP to verify your account.',
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
  // VERIFY OTP
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
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // This case should ideally not happen if signup is the only way to get an OTP
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.influencer.update({
        where: { userId: user.id },
        data: { emailVerified: true },
      });

      await prisma.otp.delete({ where: { id: otpEntry.id } });

      return res.status(200).json({ message: 'Email verified successfully. Please complete your onboarding.' });
    } catch (error: any) {
      console.error('[AuthController.verifyOtp] Error:', error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
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

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

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

      const { password: _, ...userData } = user;
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: userData,
      });
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

}

export default new AuthController();
