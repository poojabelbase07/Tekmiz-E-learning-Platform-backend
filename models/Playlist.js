// models/Playlist.js
const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String, // S3 URL
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'AI/ML', 'Full Stack', 'Android', 'Data Science', 'Cybersecurity', 'Backend', 'Frontend', 'DevOps']
  },
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: String, // Firebase UID
    required: true,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  resourcesCount: {
    type: Number,
    default: 0
  },
  trending: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
playlistSchema.index({ authorId: 1, createdAt: -1 });
playlistSchema.index({ category: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);