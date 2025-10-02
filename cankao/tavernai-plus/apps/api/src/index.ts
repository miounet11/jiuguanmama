/**
 * Application Export (for testing)
 * This file exports the Express app without starting the server
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
const { PrismaClient } = require('../node_modules/.prisma/client');

// Configure environment variables
dotenv.config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import characterRoutes from './routes/character';
import chatRoutes from './routes/chat';
import chatroomRoutes from './routes/chatroom';
import marketplaceRoutes from './routes/marketplace';
import communityRoutes from './routes/community';
import multimodalRoutes from './routes/multimodal';
import systemRoutes from './routes/system';
import logsRoutes from './routes/logs';
import aiFeaturesRoutes from './routes/ai-features';
import modelsRoutes from './routes/models';
import presetsRoutes from './routes/presets';
import worldinfoRoutes from './routes/worldinfo';
import groupchatRoutes from './routes/groupchat';
import personasRoutes from './routes/personas';
import userModeRoutes from './routes/user-mode';
import statsRoutes from './routes/stats';
import scenariosRoutes from './routes/scenarios';
import enhancedScenariosRoutes from './routes/enhancedScenarios';
import spacetimeTavernRoutes from './routes/spacetime-tavern';
import gamificationRoutes from './routes/gamification';

// UX System Routes (New)
import featuresRoutes from './routes/features';
import onboardingRoutes from './routes/onboarding';
import tutorialsRoutes from './routes/tutorials';
import notificationsRoutes from './routes/notifications';
import creatorStudioRoutes from './routes/creator-studio';
import adminConsoleRoutes from './routes/admin-console';
import gamificationDashboardRoutes from './routes/gamification-dashboard';

// Create application instance
const app: Application = express();

// Create database client
export const prisma = new PrismaClient();

// Basic middleware - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  })
);

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Static file serving
app.use('/uploads', express.static('uploads'));

// API routes - Existing
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/characters', characterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chats', chatRoutes);
app.use('/chat', chatRoutes);
app.use('/api/chatrooms', chatroomRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api', communityRoutes);
app.use('/api/multimodal', multimodalRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/ai', aiFeaturesRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/presets', presetsRoutes);
app.use('/api/worldinfo', worldinfoRoutes);
app.use('/api/groupchat', groupchatRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/user-mode', userModeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/scenarios', scenariosRoutes);
app.use('/api/enhanced-scenarios', enhancedScenariosRoutes);
app.use('/api/spacetime-tavern', spacetimeTavernRoutes);
app.use('/api/gamification', gamificationRoutes);

// API routes - UX System (New)
app.use('/api/v1/features', featuresRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/tutorials', tutorialsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/creator-studio', creatorStudioRoutes);
app.use('/api/v1/admin-console', adminConsoleRoutes);
app.use('/api/v1/gamification', gamificationDashboardRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0',
      services: {
        database: true,
      },
    };

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
