// routes/playlists.js - Playlist CRUD Routes
const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const uploadToS3 = require('../middleware/upload');

// ✅ CREATE PLAYLIST (with thumbnail upload)
router.post('/', uploadToS3.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, category, author, authorId } = req.body;

    if (!title || !description || !category || !author || !authorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required'
      });
    }

    // Create playlist
    const playlist = new Playlist({
      title,
      description,
      thumbnail: req.file.location,
      category,
      author,
      authorId
    });

    // ⭐ SAVE WITH WRITE CONCERN - Wait for confirmation
    await playlist.save({ w: 'majority', wtimeout: 5000 });

    console.log('✅ Playlist created and confirmed:', playlist._id);

    // ⭐ IMMEDIATELY READ BACK TO CONFIRM
    const confirmedPlaylist = await Playlist.findById(playlist._id);

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      playlist: confirmedPlaylist // Return confirmed data
    });

  } catch (error) {
    console.error('❌ Error creating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating playlist',
      error: error.message
    });
  }
});

// ✅ GET ALL PLAYLISTS
router.get('/', async (req, res) => {
  try {
    const { category, authorId, search } = req.query;
    
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by author
    if (authorId) {
      query.authorId = authorId;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const playlists = await Playlist.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: playlists.length,
      playlists: playlists
    });

  } catch (error) {
    console.error('❌ Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching playlists',
      error: error.message
    });
  }
});

// ✅ GET SINGLE PLAYLIST BY ID
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    res.json({
      success: true,
      playlist: playlist
    });

  } catch (error) {
    console.error('❌ Error fetching playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching playlist',
      error: error.message
    });
  }
});

// ✅ UPDATE PLAYLIST
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Update fields
    if (title) playlist.title = title;
    if (description) playlist.description = description;
    if (category) playlist.category = category;

    await playlist.save();

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      playlist: playlist
    });

  } catch (error) {
    console.error('❌ Error updating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating playlist',
      error: error.message
    });
  }
});

// ✅ DELETE PLAYLIST
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // TODO: Also delete associated resources and S3 files

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting playlist',
      error: error.message
    });
  }
});

// ✅ INCREMENT VIEW COUNT
router.post('/:id/view', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    res.json({
      success: true,
      views: playlist.views
    });

  } catch (error) {
    console.error('❌ Error updating views:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating views',
      error: error.message
    });
  }
});

module.exports = router;