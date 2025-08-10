require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const AWSXRay = require('aws-xray-sdk');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/carts'); 
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const {authMiddleware} = require('./middleware/authMiddleware');


const port = process.env.PORT || 8080;

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'ALLOWED_ORIGINS',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Enhanced CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:5173'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚡️ CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Amzn-Trace-Id', 'x-amz-security-token'],
  exposedHeaders: ['Set-Cookie', 'X-Amzn-Trace-Id']
};

AWSXRay.captureHTTPsGlobal(require('http'), true);
AWSXRay.setDaemonAddress('127.0.0.1:2000');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cors(corsOptions));

// Basic middleware setup
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const traceId = req.headers['x-amzn-trace-id'] || 'local';
  console.log(`[${traceId}] ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    body: req.body
  });
  next();
});

// Initialize AWS X-Ray

app.use(AWSXRay.express.openSegment('EcommerceApp'));

// Enhanced Health Check Endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    services: {
      database: 'connected',
      xray: process.env.AWS_XRAY_DAEMON_ADDRESS ? 'enabled' : 'disabled'
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Verify MongoDB connection
    await mongoose.connection.db.admin().ping();
    res.status(200).json(healthCheck);
  } catch (dbError) {
    healthCheck.status = 'unhealthy';
    healthCheck.services.database = 'disconnected';
    healthCheck.error = {
      message: dbError.message,
      stack: dbError.stack
    };
    res.status(503).json(healthCheck);
  }
});

// Status endpoint for basic connectivity check
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection with Enhanced Retry Logic
const connectMongoDB = async (maxRetries = 5, retryDelay = 3000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${++attempt}/${maxRetries})`);

      let uri = process.env.MONGODB_URI; // fallback từ .env nếu secret không tồn tại

      // Cố gắng lấy từ AWS Secrets Manager nếu có
      try {
        const client = new SecretsManagerClient({ region: 'ap-southeast-1' });
        const command = new GetSecretValueCommand({ SecretId: 'mongodb/connection' });
        const data = await client.send(command);

        try {
          const secret = JSON.parse(data.SecretString);
          if (secret.MONGODB_URI) {
            uri = secret.MONGODB_URI;
            console.log('✅ MongoDB URI loaded from AWS Secrets Manager (JSON format)');
          }
        } catch {
          uri = data.SecretString || uri;
          console.log('✅ MongoDB URI loaded from AWS Secrets Manager (string format)');
        }
      } catch (err) {
        console.warn('⚠️ Could not load secret from AWS Secrets Manager. Falling back to .env');
      }

      if (!uri) {
        throw new Error('MongoDB URI not found in Secrets Manager or .env');
      }

      console.log('📌 Final MongoDB URI source:', uri.includes('amazonaws') ? 'AWS Secrets' : '.env');

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 50,
        minPoolSize: 5,
        retryWrites: true,
        retryReads: true
      });

      console.log('✅ MongoDB connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.warn('🔥 Max retries reached, continuing without DB');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};


// Database connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from DB');
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Server startup sequence
const startServer = async () => {
  try {
    await connectMongoDB();
    app.use('/api/products', productRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/cart', authMiddleware, cartRoutes);
    app.use('/api/orders', authMiddleware, orderRoutes);
    app.use('/api/admin', authMiddleware, adminRoutes);
    app.use(AWSXRay.express.closeSegment());
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const errorResponse = {
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      };
      console.error('Request error:', {
        error: err.message,
        stack: err.stack,
        request: { method: req.method, url: req.originalUrl }
      });
      res.status(statusCode).json(errorResponse);
    });
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log('📊 MongoDB status:', mongoose.connection.readyState === 1 ? 'connected' : 'disconnected');
    });
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    console.error('💥 Server startup failed:', error.message);
  }
};

// Start the application
startServer().catch(error => {
  console.error('💥 Fatal application error:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});
