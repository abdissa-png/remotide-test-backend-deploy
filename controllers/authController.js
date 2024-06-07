const _ = require('lodash');
const Joi = require('joi');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("./../config")
const nodemailer = require('nodemailer');
const { hashPassword, comparePassword } = require('../helpers/auth');
const AppError = require('./../helpers/appError');
const catchAsync = require('./../helpers/catchAsync');
const TalentProfile = require('../models/talentProfileModel');
const CompanyProfile = require('../models/companyProfileModel');




const handleAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

const signup = catchAsync(async (req, res, next) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email already exists', 400));
  }
  
  
  if (req.body.role!=="talent" && req.body.role!=="company" ){
    return next(new AppError("You are not allowed to signup in roles other than talent and company.",401))
  }

  if (req.body.password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));

  }

  // Hashing the password
  const hashedPassword = await hashPassword(req.body.password);
  
  // Create a new user based on the selected model
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role,
  });

  // Create a profile based on user role
  if (newUser.role === 'talent') {
    await TalentProfile.create({
      userId: newUser._id,
    });
  } else if (newUser.role === 'company') {
    await CompanyProfile.create({
      userId: newUser._id,
      companyEmail: newUser.email,
    });
  } 

  // Generate JWT token
  const token = jwt.sign(
    { userId: newUser._id, role: newUser.role },
    JWT_SECRET
  );

  // Include token in response header
  res.setHeader('auth-token', `Bearer ${token}`);
  const {password:pass,...userData}=newUser.toJSON();

  res.status(201).json({
    status: 'success',
    token,
    data: {
      newUser:userData,
    },
  });
});



const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email:email});


  
  if (!user || !(await comparePassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  
  if (!user.isActive) {
    return next(new AppError("User has been deactivated.",404))
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET
  );

  // Include token in response header
  res.setHeader('auth-token', `Bearer ${token}`);
  const {password:pass,...userData}=user.toJSON();
  res.status(200).json({
    status: 'success',
    user:userData,
    token,
  });
});

// Example of using catchAsync with other functions
exports.someOtherAsyncFunction = catchAsync(async (req, res, next) => {
  // Your asynchronous logic here
});
const getUserIdFromToken = (token) => {
  // Verify the token and extract its payload
  const decoded = jwt.verify(token, JWT_SECRET);
  // Extract user ID from the payload
  const userId = decoded.userId;
  return userId;
};

const changePassword=catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;
   
   

  try {
    // Retrieve the user from the database based on the user ID
    const user = await User.findById(userId);

    const Password=user.password;
    // Hash the user's input for the current password
    

    // Compare the hashed current password with the one stored in the database
    const isPasswordCorrect = await comparePassword(currentPassword, Password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();
    // Generate JWT token
    const token = jwt.sign(
     { userId: user._id, role: user.role },
     JWT_SECRET
    ); 
    res.status(200).json({
      status: 'success',
      user,
      token,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const editProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId; // Assuming you're using middleware to extract user ID from the token
  const { name, email } = req.body;

  try {
      // Find the user by ID
      const user = await User.findById(userId);

      // Update the user's name and email
      user.name = name;
      user.email = email;

      // Save the updated user
      await user.save();
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET
       ); 
       // Respond with success message
      res.status(200).json({
        status: 'Profile updated successfully.',
        user,
        token,
      });
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = {
  signup,
  login,
  changePassword,
  editProfile
};
