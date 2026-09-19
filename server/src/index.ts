import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initSocketServer } from './websocket/socketServer';
import { startOverdueTaskJob, stopOverdueTaskJob } from './jobs/overdueTaskJob';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// Centralized Error Handler (must be after routes)
app.use(errorHandler);

// Initialize WebSocket Server
initSocketServer(server);

// Start Background Jobs
startOverdueTaskJob();

// Start Server
server.listen(PORT, () => {
  logger.info(`🚀 WorkTrackr Server running on port ${PORT}`);
  logger.info(`🌐 Allowed Client Origin: ${CLIENT_URL}`);
  logger.info(`🔌 WebSocket Server initialized`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  stopOverdueTaskJob();

  server.close(async () => {
    logger.info('HTTP and WebSocket server closed.');
    await prisma.$disconnect();
    logger.info('Database connections closed.');
    process.exit(0);
  });

  // Force exit if hanging
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
