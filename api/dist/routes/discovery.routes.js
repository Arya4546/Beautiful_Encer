import { Router } from 'express';
import discoveryController from '../controllers/discovery.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(protect);
// Get influencers (for salons)
router.get('/influencers', discoveryController.getInfluencers.bind(discoveryController));
// Get salons (for influencers)
router.get('/salons', discoveryController.getSalons.bind(discoveryController));
// Get available regions
router.get('/regions', discoveryController.getRegions.bind(discoveryController));
// Get available categories
router.get('/categories', discoveryController.getCategories.bind(discoveryController));
export default router;
