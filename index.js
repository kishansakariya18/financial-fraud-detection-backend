const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./db/connection');

// Import routes
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const fraudRoutes = require('./routes/fraud.routes');
const budgetRoutes = require('./routes/budget.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const categoryRoutes = require('./routes/category.routes');

// Import middleware
// TODO: Create middleware files and uncomment
// const errorHandler = require('./middleware/error.middleware');
// const authMiddleware = require('./middleware/auth.middleware');

// Import queue processor
const { processFraudQueue } = require('./queues/fraud.queue');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined')); // Request logging

// Connect to database
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Fraud Detection API is running',
    timestamp: new Date().toISOString()
  });
});


// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/fraud', fraudRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handling middleware
// TODO: Uncomment when error middleware is created
// app.use(errorHandler);

// Temporary error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize fraud detection queue processor
// TODO: Uncomment when queue is fully implemented
// processFraudQueue().catch(err => {
//   console.error('Failed to start fraud queue processor:', err);
// });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fraud Detection API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    // TODO: Close database connections, queue connections, etc.
    process.exit(0);
  });
});

module.exports = app;
