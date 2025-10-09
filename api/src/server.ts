import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);

app.listen(PORT, () => {
  console.log(`[server]: Running at http://localhost:${PORT}`);
});
