import { Router } from 'express';
import proxyController from '../controllers/proxy.controller.js';

const router = Router();

// Proxy Instagram images
router.get('/image', proxyController.proxyImage);

export default router;
