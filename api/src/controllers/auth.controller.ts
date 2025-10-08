import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

class AuthController {
  // ===========================
  // SIGNUP
  // ===========================
  async signup(req: Request, res: Response) {
    try {
      const { name, username, email, password, phoneNo, profilePic } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: {
          name,
          username,
          email,
          hashedPassword,
          phoneNo,
          profilePic,
        },
      });

      const { hashedPassword: _, ...user } = newUser;
      return res.status(201).json({ message: 'User created successfully', user });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target ?? [];
        if (target.includes('email')) return res.status(409).json({ error: 'Email already exists' });
        if (target.includes('username')) return res.status(409).json({ error: 'Username already exists' });
      }
      console.error('[AuthController.signup] Error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
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
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

      const { hashedPassword, ...userData } = user;
      return res.status(200).json({ message: 'Login successful', user: userData });
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
}

export default new AuthController();
