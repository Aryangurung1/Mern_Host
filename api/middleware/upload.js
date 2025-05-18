import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log('Upload directory path:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created successfully');
} else {
  console.log('Uploads directory already exists');
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Multer destination called for file:', file.originalname);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    console.log('Multer filename called for file:', file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const newFilename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generated filename:', newFilename);
    cb(null, newFilename);
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  console.log('Multer fileFilter checking file:', file.originalname, 'mimetype:', file.mimetype);
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|avif)$/)) {
    console.log('File rejected - not an allowed image type:', file.originalname);
    return cb(new Error('Only image files are allowed!'), false);
  }
  console.log('File accepted:', file.originalname);
  cb(null, true);
};

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.code, err.message);
    return res.status(400).json({ 
      error: 'File upload error', 
      code: err.code,
      message: err.message 
    });
  }
  if (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
  next();
};

// Configure upload
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

// Export the error handler
export const multerErrorHandler = handleMulterError;

// Helper function to get URL from path
export const getFileUrl = (filePath) => {
  // Get the filename from the path
  const filename = path.basename(filePath);
  console.log('Generating URL for file:', filename);
  
  // Return the URL relative to the uploads directory
  return `/uploads/${filename}`;
};
