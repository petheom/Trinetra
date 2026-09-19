import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import inspectionRoutes from './routes/inspectionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import scannerRoutes from './routes/scannerRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB (skip during automated integration tests)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// Security & Parsing Middleware
const clientOrigin = process.env.CLIENT_URL;
app.use(
  cors({
    origin: clientOrigin && clientOrigin !== '*' ? clientOrigin : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check / API Root
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'TriNetra Legal Metrology Enterprise API',
    version: '1.0.0',
    governingRules: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    endpoints: {
      auth: '/api/auth',
      inspections: '/api/inspections',
      debug: '/api/debug/check-data',
      health: '/api/health',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[TriNetra Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[TriNetra Server] Auth API available at http://localhost:${PORT}/api/auth`);
    console.log(`[TriNetra Server] Inspections API available at http://localhost:${PORT}/api/inspections`);
  });
}

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection:', err.message);
  // In production, keep server alive or perform graceful restart
});

export default app;
