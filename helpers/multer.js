const multer = require('multer');

// Set up storage for multer
const storage = multer.memoryStorage(); // Store files in memory

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5 MB
}).single('resume'); // Name of the field in the form

// Middleware to handle file upload
function handleFileUpload(req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ error: 'File upload error' });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ error: 'Server error' });
    }
    next(); // Move to the next middleware
  });
}
