import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ===========================
// MIDDLEWARES
// ===========================
app.use(cors());
app.use(express.json());

// ===========================
// ROUTES
// ===========================
app.use('/api/v1/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Express + TypeScript Server is running!');
});

// ===========================
// START SERVER
// ===========================
app.listen(PORT, () => {
  console.log(`[server]: Running at http://localhost:${PORT}`);
});
