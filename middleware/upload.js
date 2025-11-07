// middleware/upload.js - AWS S3 File Upload Handler
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// File filter to allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'video/mp4': true,
    'video/webm': true,
    'video/quicktime': true, // .mov files
    'application/pdf': true,
    'application/vnd.ms-powerpoint': true, // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true // .pptx
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Only images, videos, PDFs, and PPTs are allowed.`), false);
  }
};

// Generate unique filename
const generateFileName = (file) => {
  const fileExtension = path.extname(file.originalname);
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${fileExtension}`;
};

// Multer S3 configuration
const uploadToS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname
      });
    },
    key: (req, file, cb) => {
      // Organize files by type
      let folder = 'others';
      if (file.mimetype.startsWith('image/')) {
        folder = 'thumbnails';
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'videos';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'pdfs';
      } else if (file.mimetype.includes('presentation')) {
        folder = 'presentations';
      }

      const fileName = generateFileName(file);
      cb(null, `${folder}/${fileName}`);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

module.exports = uploadToS3;