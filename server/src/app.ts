import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/auth.routes';
import { tripsRouter } from './modules/trips/trips.routes';
import { invitesRouter } from './modules/invites/invites.routes';
import { UPLOADS_ROOT, usesDiskStore } from './shared/storage/fileStore';
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({
  origin: process.env['CLIENT_URL'] || 'http://localhost:5174',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (usesDiskStore) app.use('/api/uploads', express.static(UPLOADS_ROOT, { fallthrough: false }));

// Module routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/invites', invitesRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
