const Guide = require('../models/guideModel');
const AppError = require('./../helpers/appError');
const catchAsync = require('./../helpers/catchAsync');



// Controller function to create a new guide
const createGuide = catchAsync(async (req, res) => {
  const { title, description } = req.body;

  // Create a new guide document
  const guide = new Guide({
    title,
    description,
  });

  // Save the guide to the database
  await guide.save();

  res.status(201).json({ status:"success",message: 'Guide created successfully', guide });
});

// Controller function to get all guides
const getAllGuides = catchAsync(async (req, res) => {
  const guides = await Guide.find({isActive:true});
  res.status(200).json({ status:"success", guides });
});

// Controller function to get a single guide by ID
const getGuideById = catchAsync(async (req, res) => {
  const guide = await Guide.findOne({_id:req.params.id,isActive:true});
  if (!guide) {
    throw new AppError('Guide not found', 404);
  }
  res.status(200).json({ status:"success", guide });
});

// Controller function to update a guide by ID
const updateGuideById = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  const guide = await Guide.findByIdAndUpdate(
    req.params.id,
    { title, description },
    { new: true }
  );
  if (!guide) {
    throw new AppError('Guide not found', 404);
  }
  res.status(200).json({ status:"success",message: 'Guide updated successfully', guide });
});

// Controller function to delete a guide by ID
const deleteGuideById = catchAsync(async (req, res) => {
  const guide = await Guide.findOne({_id:req.params.id,isActive:true});
  if (!guide) {
    throw new AppError('Guide not found', 404);
  }
  guide.isActive=false;
  await guide.save();
  res.status(200).json({ status:"success", message: 'Guide deleted successfully', guide });
});

module.exports = {
  createGuide,
  getAllGuides,
  getGuideById,
  updateGuideById,
  deleteGuideById,
};
