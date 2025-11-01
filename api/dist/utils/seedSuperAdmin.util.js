import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import logger from './logger.util.js';
/**
 * Super Admin Seed Utility
 * Checks if any ADMIN role user exists, if not creates a default super admin
 * This prevents hardcoded credentials exposure
 */
const DEFAULT_ADMIN_EMAIL = 'admin@beautifulencer.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';
const DEFAULT_ADMIN_NAME = 'Super Admin';
export async function seedSuperAdmin() {
    try {
        // Check if ANY admin user already exists (check by role, not email)
        const existingAdmin = await prisma.user.findFirst({
            where: { role: Role.ADMIN },
        });
        if (existingAdmin) {
            logger.log('[Super Admin Seed] Admin user already exists. Skipping seed.');
            return;
        }
        // No admin found - create default admin account
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
        const superAdmin = await prisma.user.create({
            data: {
                name: DEFAULT_ADMIN_NAME,
                email: DEFAULT_ADMIN_EMAIL,
                password: hashedPassword,
                role: Role.ADMIN,
                termsAccepted: true,
                termsAcceptedAt: new Date(),
            },
        });
        logger.log('[Super Admin Seed] ✓ Default admin account created successfully');
        logger.log('[Super Admin Seed] Email:', DEFAULT_ADMIN_EMAIL);
        logger.log('[Super Admin Seed] Password: Admin@123456');
        logger.log('[Super Admin Seed] User ID:', superAdmin.id);
        logger.log('[Super Admin Seed] IMPORTANT: Please change the password after first login!');
    }
    catch (error) {
        logger.error('[Super Admin Seed] Error creating super admin:', error);
        // Don't throw - allow server to continue starting
    }
}
