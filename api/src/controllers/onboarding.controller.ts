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

      // Parse categories if it's a string
      const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      const parsedAge = typeof age === 'string' ? parseInt(age, 10) : age;

      // Validate types
      if (typeof bio !== 'string' || !Array.isArray(parsedCategories) || typeof region !== 'string' || typeof parsedAge !== 'number' || !Object.values(Gender).includes(gender)) {
        return res.status(400).json({ error: 'Invalid field types or values' });
      }

      // Update the influencer record
      const updatedInfluencer = await prisma.influencer.update({
        where: { userId },
        data: {
          bio,
          categories: parsedCategories,
          region,
          age: parsedAge,
          gender,
        },
      });

      // Upload image to Cloudinary
      if (file) {
        // Convert buffer to a base64 data URI
        const b64 = Buffer.from(file.buffer).toString('base64');
        let dataURI = 'data:' + file.mimetype + ';base64,' + b64;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'influencer-profiles',
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

  // ===========================
  // SALON ONBOARDING
  // ===========================
  async salonOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const file = req.file; // Single file upload for profilePic only
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Destructure all fields
      const {
        businessName,
        description,
        preferredCategories,
        website,
        establishedYear,
        teamSize,
        operatingHours,
        instagramHandle,
        tiktokHandle,
        facebookPage,
      } = req.body;

      // Validation: required fields
      if (!businessName || !description || !preferredCategories) {
        return res.status(400).json({ 
          error: 'Missing required fields: businessName, description, and preferredCategories are required' 
        });
      }

      // Parse preferredCategories if it's a string
      const parsedCategories = typeof preferredCategories === 'string' ? JSON.parse(preferredCategories) : preferredCategories;
      
      // Parse numeric fields
      const parsedEstablishedYear = establishedYear ? (typeof establishedYear === 'string' ? parseInt(establishedYear, 10) : establishedYear) : null;
      const parsedTeamSize = teamSize ? (typeof teamSize === 'string' ? parseInt(teamSize, 10) : teamSize) : null;

      // Validate types
      if (!Array.isArray(parsedCategories) || parsedCategories.length === 0) {
        return res.status(400).json({ error: 'Preferred categories must be a non-empty array' });
      }

      // Prepare update data
      const updateData: any = {
        businessName,
        description,
        preferredCategories: parsedCategories,
        website: website || null,
        establishedYear: parsedEstablishedYear,
        teamSize: parsedTeamSize,
        operatingHours: operatingHours || null,
        instagramHandle: instagramHandle || null,
        tiktokHandle: tiktokHandle || null,
        facebookPage: facebookPage || null,
      };

      // Upload profile picture if provided
      if (file) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'salon-profiles',
        });

        updateData.profilePic = uploadResponse.secure_url;
      }

      // Update the salon record
      const updatedSalon = await prisma.salon.update({
        where: { userId },
        data: updateData,
      });

      return res.status(200).json({
        message: 'Salon onboarding completed successfully',
        salon: updatedSalon,
      });
    } catch (error: any) {
      console.error('[OnboardingController.salonOnboarding] Error:', error);

      // Prisma specific error handling
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Salon record not found' });
      }

      return res.status(500).json({ error: 'Failed to complete salon onboarding' });
    }
  }
}

export default new OnboardingController();
