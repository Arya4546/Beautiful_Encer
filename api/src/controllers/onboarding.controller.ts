import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role, Gender } from '@prisma/client'; // Prisma enums
import cloudinary from '../config/cloudinary.config.js';

import 'multer'; 
// Extend Express Request to include authenticated user info
interface AuthenticatedRequest extends Request {
  file?: Express.Multer.File;
  user?: {
    userId: string;
    role: Role; // must match Prisma Role enum
  };
}

class OnboardingController {
  // ===========================
  // INFLUENCER ONBOARDING
  // ===========================
  async influencerOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      //Multer file
      const file = req.file;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Destructure all required fields
      const { bio, categories, region, age, gender } = req.body; // profilePic comes from the file

      // Validation: all fields are required
      if (!bio || !file || !categories || !region || !age || !gender) {
        return res.status(400).json({ error: 'All fields are required for onboarding' });
      }

      // Validate types
      if (typeof bio !== 'string' || !Array.isArray(categories) || typeof region !== 'string' || typeof age !== 'number' || !Object.values(Gender).includes(gender)) {
        return res.status(400).json({ error: 'Invalid field types or values' });
      }

      // Update the influencer record
      const updatedInfluencer = await prisma.influencer.update({
        where: { userId },
        data: {
          bio, // profilePic will be updated after upload
          categories,
          region,
          age,
          gender,
        },
      });

      // Upload image to Cloudinary
      if (file) {
        // Convert buffer to a base64 data URI
        const b64 = Buffer.from(file.buffer).toString('base64');
        let dataURI = 'data:' + file.mimetype + ';base64,' + b64;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'profile-pictures', // Optional folder in Cloudinary
        });

        // Update the influencer with the Cloudinary URL
        updatedInfluencer.profilePic = uploadResponse.secure_url;
        await prisma.influencer.update({ where: { userId }, data: { profilePic: uploadResponse.secure_url } });
      }

      return res.status(200).json({
        message: 'Onboarding completed successfully',
        influencer: updatedInfluencer,
      });
    } catch (error: any) {
      console.error('[OnboardingController.influencerOnboarding] Error:', error);

      // Prisma specific error handling
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Influencer record not found' });
      }

      return res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }
}

export default new OnboardingController();
