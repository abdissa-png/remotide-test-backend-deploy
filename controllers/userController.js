const User = require('../models/userModel');
const TalentProfile = require('../models/talentProfileModel');
const CompanyProfile = require('../models/companyProfileModel');
const AppError = require('./../helpers/appError');
const catchAsync = require('./../helpers/catchAsync');
const multer = require("multer");
const path  = require("path");
const { upload,staticFilePath } = require("../helpers/fileUpload")
const ResumeData = require('../models/ResumeDataModel');
const fs = require('fs');
const pdf = require('pdf-parse'); // Import the pdf module
const mongoose = require('mongoose');


const handleAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
const getTalentProfile=catchAsync(async (req,res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ID provided', 400);
  }

  const user = await User.findOne({ _id: userId,isActive:true });
  if (!user) {
    throw new AppError('No user data available for the given ID', 400);
  }

  const existingProfile = await TalentProfile.findOne({ userId: userId });
  if (!existingProfile) {
    throw new AppError('Talent profile not found', 404);
  };
  res.status(200).json({
    status: 'success',
    message: 'Talent profile fetched successfully',
    data: {
      talentProfile: existingProfile,
    },
  });
});


const updateTalentProfile = catchAsync(async (req, res) => {
  let resume;
  let profileImage;
  let idFile;
  let body;
  let attachment;
  // Handle file upload
  await new Promise((resolve, reject) => {
    upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'resume', maxCount: 1 },{ name: 'idFile', maxCount: 1 },{name:'attachment',maxCount:1}])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return reject(new AppError('Error uploading file', 500));
      } else if (err) {
        return reject(new AppError('An unexpected error occurred', 500));
      }

      if (req?.files?.resume) {
        resume = req?.files?.resume[0];
      }

      if (req?.files?.profileImage) {
        profileImage = req?.files?.profileImage[0];
      }
      if (req?.files?.idFile) {
        idFile = req?.files?.idFile[0];
      }
      if (req?.files?.attachment) {
        attachment = req?.files?.attachment[0];
      }
      if (req?.body?.values) {
       
        console.log(body)
      }

      resolve(); // Resolve the promise after file upload
    });
  });
  body = JSON.parse(req?.body?.values);
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ID provided', 400);
  }

  const user = await User.findOne({ _id: userId, isActive: true });

  if (!user) {
    throw new AppError('No user data available for the given ID', 400);
  }

  let existingProfile = await TalentProfile.findOne({ userId: userId });

  if (!existingProfile) {
    throw new AppError('Talent profile not found', 404);
  }

  // Update the existingProfile document with the new resume file path and JSON data
  if (resume) {
    existingProfile.resume = `${staticFilePath}/${path.basename(resume.path)}`;

    // Convert PDF resume to JSON
    const pdfBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(pdfBuffer);
    const resumeJson = {
      text: pdfData.text, // JSON object containing extracted text from resume
      userId: userId // Add the user ID here
    };

    // Update or replace JSON resume data in ResumeData collection
    await ResumeData.findOneAndUpdate({ userId: userId }, resumeJson, { upsert: true });
  }

  if (idFile) {
    existingProfile.idFile = `${staticFilePath}/${path.basename(idFile.path)}`;
  }

  if (profileImage) {
    existingProfile.profileImage = `${staticFilePath}/${path.basename(profileImage.path)}`;
  }
  
  if (attachment) {
    existingProfile.attachment = `${staticFilePath}/${path.basename(attachment.path)}`;
  }

  // Update other fields
  for (const key in body) {
    if (Object.hasOwnProperty.call(body, key)) {
      existingProfile[key] = body[key];
    }
  }

  await existingProfile.save();

  res.status(200).json({
    status: 'success',
    message: 'Talent profile updated successfully',
    data: {
      talentProfile: existingProfile,
    },
  });
});


const getCompanyProfile = catchAsync(async (req,res) => {
  const userId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ID provided', 400); // Ensure that the error message is set here
  }
  

  const user = await User.findOne({ _id: userId,isActive:true });
  if (!user) {
    throw new AppError('No user data available for the given ID', 400);
  }

  const existingProfile = await CompanyProfile.findOne({ userId: userId });
  if (!existingProfile) {
    throw new AppError('Company profile not found', 404);
  }

  res.status(200).json({
    status: 'success',
    message: 'Company profile fetched successfully',
    data: {
      companyProfile: existingProfile,
    },
  });
})
const updateCompanyProfile = catchAsync(async (req, res) => {
  let profileImage; // Declare file variable outside the upload.single callback
  let body;
  // Handle file upload
  await new Promise((resolve, reject) => {
    upload.fields([{ name: 'profileImage', maxCount: 1 }])(req, res, (err) => {
       if (err instanceof multer.MulterError) {
         return reject(new AppError('Error uploading file', 500));
       } else if (err) {
         return reject(new AppError('An unexpected error occurred', 500));
       }
       if (req?.files?.profileImage) {
         profileImage = req?.files?.profileImage[0];
       }
       if (req?.body.values) body=JSON.parse(req?.body?.values)

       resolve(); // Resolve the promise after file upload
     });
 });
  const userId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ID provided', 400); // Ensure that the error message is set here
  }
  

  const user = await User.findOne({ _id: userId,isActive:true });
  if (!user) {
    throw new AppError('No user data available for the given ID', 400);
  }

  const existingProfile = await CompanyProfile.findOne({ userId: userId });
  if (!existingProfile) {
    throw new AppError('Company profile not found', 404);
  }
  if (profileImage) {
    existingProfile.profileImage=`${staticFilePath}/${path.basename(profileImage.path)}`
  }
  for (const key in body) {
    if (Object.hasOwnProperty.call(body, key)) {
      existingProfile[key] = body[key];
    }
  }

  await existingProfile.save();

  res.status(200).json({
    status: 'success',
    message: 'Company profile updated successfully',
    data: {
      companyProfile: existingProfile,
    },
  });
});
module.exports={
  getTalentProfile,
  getCompanyProfile,
  updateCompanyProfile,
  updateTalentProfile,
}
