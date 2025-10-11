import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import socialMediaRoutes from './routes/socialMedia.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import connectionRoutes from './routes/connection.routes.js';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/social-media', socialMediaRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/connections', connectionRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`[server]: Running at http://localhost:${PORT}`);
});
