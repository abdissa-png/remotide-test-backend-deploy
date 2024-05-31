const Joi = require('joi');
const CompanyProfile = require('../models/companyProfileModel');
const User = require('../models/user');
const mongoose = require('mongoose');
const AppError = require('./../helpers/appError');

// Define the validation schema using Joi
const companyProfileSchema = Joi.object({
  userId: Joi.string().required(), // Assuming userId is a string
  name: Joi.string().required().min(3),
  companyEmail: Joi.string().email().required(),
  description: Joi.string().required().min(12),
  website: Joi.string().uri().required(),
});

const createCompanyProfile = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = companyProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message);
      return next(new AppError(errorMessage[0], 400));
    }

    // Check if userId is provided
    if (!req.body.userId) {
      return next(new AppError('User ID is required', 400));
    }

    // Check if userId is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.body.userId);
    if (!isValidObjectId) {
      return next(new AppError('Invalid User ID', 400));
    }

    // Check if a user with the provided userId exists
    const user = await User.findOne({ _id: req.body.userId });
    if (!user) {
      return next(new AppError('No user data available for the given ID', 400));
    }

    // Check if a talent profile with the provided userId already exists
    const existingProfile = await CompanyProfile.findOne({
      userId: req.body.userId,
    });
    if (existingProfile) {
      return next(new AppError('A profile already exists for the given user ID', 400));
    }

    // Create company profile
    const companyProfile = new CompanyProfile(req.body);
    await companyProfile.save();

    res.status(201).json({ message: 'Company profile created successfully' });
  } catch (error) {
    // Check if the error is a duplicate key error for the companyEmail field
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyValue &&
      error.keyValue.companyEmail
    ) {
      // If the error is due to a duplicate key violation, send an appropriate error response
      return next(new AppError('Email already in use', 400));
    }
    console.error(error);
    next(new AppError('Internal Server Error', 500));
  }
};

module.exports = {
  createCompanyProfile,
};
