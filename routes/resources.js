// routes/resources.js - Resource Management Routes
const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Playlist = require('../models/Playlist');
const uploadToS3 = require('../middleware/upload');

// ✅ ADD RESOURCE TO PLAYLIST (with file upload)
router.post('/playlist/:playlistId', uploadToS3.single('file'), async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { type, title, description, youtubeUrl, uploadedBy } = req.body;

    // Validate playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;

    // Handle YouTube link
    if (type === 'youtube') {
      if (!youtubeUrl) {
        return res.status(400).json({
          success: false,
          message: 'YouTube URL is required for youtube type'
        });
      }
      fileUrl = youtubeUrl;
    } else {
      // Handle file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required'
        });
      }
      fileUrl = req.file.location; // S3 URL
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    // Get current resource count to set order
    const resourceCount = await Resource.countDocuments({ playlistId });

    // Create resource
    const resource = new Resource({
      playlistId,
      type,
      title,
      description,
      fileUrl,
      fileName,
      fileSize,
      order: resourceCount + 1,
      uploadedBy
    });

    await resource.save();

    // Update playlist resource count
    playlist.resourcesCount = resourceCount + 1;
    await playlist.save();

    console.log('✅ Resource added:', resource._id);

    res.status(201).json({
      success: true,
      message: 'Resource added successfully',
      resource: resource
    });

  } catch (error) {
    console.error('❌ Error adding resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding resource',
      error: error.message
    });
  }
});

// ✅ GET ALL RESOURCES FOR A PLAYLIST
router.get('/playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;

    const resources = await Resource.find({ playlistId }).sort({ order: 1 });

    res.json({
      success: true,
      count: resources.length,
      resources: resources
    });

  } catch (error) {
    console.error('❌ Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
});

// ✅ GET SINGLE RESOURCE BY ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.json({
      success: true,
      resource: resource
    });

  } catch (error) {
    console.error('❌ Error fetching resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: error.message
    });
  }
});

// ✅ UPDATE RESOURCE
router.put('/:id', async (req, res) => {
  try {
    const { title, description, order } = req.body;
    
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Update fields
    if (title) resource.title = title;
    if (description) resource.description = description;
    if (order) resource.order = order;

    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource: resource
    });

  } catch (error) {
    console.error('❌ Error updating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message
    });
  }
});

// ✅ DELETE RESOURCE
router.delete('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const playlistId = resource.playlistId;

    // TODO: Delete S3 file

    await Resource.findByIdAndDelete(req.params.id);

    // Update playlist resource count
    const playlist = await Playlist.findById(playlistId);
    if (playlist) {
      const newCount = await Resource.countDocuments({ playlistId });
      playlist.resourcesCount = newCount;
      await playlist.save();
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message
    });
  }
});

// ✅ REORDER RESOURCES
router.put('/playlist/:playlistId/reorder', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { resourceOrders } = req.body; // Array of {id, order}

    // Update each resource's order
    const updatePromises = resourceOrders.map(({ id, order }) => 
      Resource.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Resources reordered successfully'
    });

  } catch (error) {
    console.error('❌ Error reordering resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering resources',
      error: error.message
    });
  }
});

module.exports = router;