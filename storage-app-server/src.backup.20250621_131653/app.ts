import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRoutes from './api/auth';
import clientRoutes from './api/clients';
import productRoutes from './api/products';
import reportRoutes from './api/reports';
import userRoutes from './api/users'; // Adjust the import path as needed
import worksiteRoutes from './api/worksites'; // Import the worksite routes
import connectDB from './config/database'; // import { initDatabase } from './seeds';
// import { initDatabase } from './seeds';

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
  process.env.CLIENT_URL,
].filter(Boolean); // This removes any undefined or null values

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

console.log('Allowed CORS origins:', allowedOrigins);
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Using CLIENT_URL:', process.env.CLIENT_URL);

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/worksites', worksiteRoutes); // Use the worksite routes

// Serve static files from your frontend build folder, if applicable
app.use(express.static(path.join(__dirname, '../client/public')));

// Catch-all for any other route: serve index.html for your SPA
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

const PORT = process.env.PORT || 1669;

async function startServer() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // if (process.env.NODE_ENV === 'development') {
    //   await initDatabase();
    //   console.log('Database initialized with seed data');
    // }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
