import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRoutes from './api/auth';
import clientRoutes from './api/clients';
import productRoutes from './api/products';
import reportRoutes from './api/reports';
import userRoutes from './api/users';
import worksiteRoutes from './api/worksites';
import aiRoutes from './api/ai';
import connectDB from './config/database';

// Load environment variables
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.remote') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:1671',
  'http://localhost:5173',
  'http://termoparotto.micro-cloud.it:16788',
  'http://termoparotto.micro-cloud.it',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

console.log('Allowed CORS origins:', allowedOrigins);
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Using CLIENT_URL:', process.env.CLIENT_URL);

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/worksites', worksiteRoutes);
app.use('/api/ai', aiRoutes);

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Get server uptime
    const uptime = process.uptime();
    const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Test database connection
    let dbStatus = 'unknown';
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
      } else if (mongoose.connection.readyState === 2) {
        dbStatus = 'connecting';
      } else if (mongoose.connection.readyState === 3) {
        dbStatus = 'disconnecting';
      } else {
        dbStatus = 'disconnected';
      }
    } catch (error) {
      dbStatus = 'error';
    }

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: {
        server: '5.0',
        client: '5.0'
      },
      name: 'Termoparotto Server',
      author: {
        name: 'Antonio Guiotto',
        email: 'antonio@palloncino.it'
      },
      environment: process.env.NODE_ENV || 'production',
      uptime: uptimeString,
      uptimeSeconds: Math.floor(uptime),
      memory: memUsageMB,
      database: {
        status: dbStatus,
        type: 'MongoDB'
      },
      deployment: {
        lastCommit: new Date().toISOString(),
        lastDeploy: new Date().toISOString(),
        version: '5.0'
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to retrieve health information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../../storage-app-client/dist')));

// Catch-all for SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const indexPath = path.join(
    __dirname,
    '../../storage-app-client/dist/index.html'
  );
  res.sendFile(indexPath, err => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

const PORT = process.env.PORT || 1669;

async function startServer() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
