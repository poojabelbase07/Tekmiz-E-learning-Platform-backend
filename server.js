// server.js - Main Express Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const playlistRoutes = require('./routes/playlists');
const resourceRoutes = require('./routes/resources');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection - FORCE PRIMARY READ
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  readPreference: 'primary', // Always read most recent data
  retryWrites: true,
  w: 'majority' //  Wait for write confirmation
})
.then(() => console.log('✅ MongoDB Connected (Primary Read Mode)'))
.catch((err) => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/api/playlists', playlistRoutes);
app.use('/api/resources', resourceRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Tekmiz Backend API Running!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
});