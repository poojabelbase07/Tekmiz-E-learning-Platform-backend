// models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'pdf', 'youtube', 'document', 'image']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String, // S3 URL or YouTube URL
    required: true
  },
  fileName: {
    type: String // Original file name
  },
  fileSize: {
    type: Number // In bytes
  },
  duration: {
    type: String // For videos (e.g., "10:30")
  },
  order: {
    type: Number, // Order in playlist
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: String, // Firebase UID
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
resourceSchema.index({ playlistId: 1, order: 1 });

module.exports = mongoose.model('Resource', resourceSchema);