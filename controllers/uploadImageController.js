// companyProfileImageController.js

const multer = require('multer');
const path = require('path');
const CompanyProfile= require('../models/companyProfileModel');
const TalentProfile= require('../models/talentProfileModel');

// Define storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/company-profiles'); // Specify the directory where images will be stored
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by appending the current date/time to the original filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// Configure multer for handling image uploads
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit image file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image')) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only image files are allowed')); // Reject the file
    }
  }
}).single('image');

// Controller method to handle image upload for company profile
const uploadCompanyProfileImage = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      // Handle multer errors for image upload
      return res.status(400).json({ status: 'error', message: err.message });
    }

    // If image upload is successful, update the company profile model with the image URL
    const imageUrl = req.file ? `/uploads/company-profiles/${req.file.filename}` : null;
    const userId = req.params.companyId; // Get company ID from request params
          console.log(userId);
    try {
      // Find the company profile by companyId
      const companyProfile = await CompanyProfile.findOne({userId:userId});
      if (!companyProfile) {
        return res.status(404).json({ status: 'error', message: 'Company profile not found' });
      }

      // Update the company profile with the image URL
      companyProfile.imageUrl = imageUrl;
      await companyProfile.save();

      // Return success response with updated company profile
      res.status(200).json({ status: 'success', data: { companyProfile } });
    } catch (error) {
      // Handle any database or server errors
      console.error('Error updating company profile:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });
};

// Controller method to handle image upload for talent  profile
const uploadTalentProfileImage = (req, res, next) => {
    uploadImage(req, res, async (err) => {
      if (err) {
        // Handle multer errors for image upload
        return res.status(400).json({ status: 'error', message: err.message });
      }
  
      // If image upload is successful, update the company profile model with the image URL
      const imageUrl = req.file ? `/uploads/talent-profiles/${req.file.filename}` : null;
      const userId = req.params.TalentId; // Get company ID from request params
            console.log(userId);
      try {
        // Find the company profile by companyId
        const companyProfile = await TalentProfile.findOne({userId:userId});
        if (!companyProfile) {
          return res.status(404).json({ status: 'error', message: 'talent profile not found' });
        }
  
        // Update the company profile with the image URL
        companyProfile.imageUrl = imageUrl;
        await companyProfile.save();
  
        // Return success response with updated company profile
        res.status(200).json({ status: 'success',message: 'talent profile updated successfully', data: { companyProfile } });
      } catch (error) {
        // Handle any database or server errors
        console.error('Error updating talent profile:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
      }
    });
  };

module.exports = {
  uploadCompanyProfileImage,
  uploadTalentProfileImage,

};
