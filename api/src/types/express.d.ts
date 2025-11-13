import { Role, Salon, Influencer } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        salon?: Salon;
        influencer?: Influencer;
      };
    }
  }
}
