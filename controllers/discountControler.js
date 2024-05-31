const Discount = require('../models/dicountModel');
const catchAsync = require('../helpers/catchAsync');
const mongoose=require('mongoose')

const createDiscount = catchAsync(async (req, res) => {
  const newDiscount = await Discount.create(req.body);
  res.status(201).json({
    status: 'success',
    message:'new discount created successfully',
    data: {
      discount: newDiscount,
    },
  });
});
// get all the discounts 
const getAllDiscounts = catchAsync(async (req, res) => {
  const discounts = await Discount.find();
  res.status(200).json({
    status: 'success',
    data: {
      discounts,
    },
  });
});

// update discount 
const updateDiscountById = catchAsync(async (req, res) => {
  const updatedDiscount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedDiscount) {
    // Handle the case where the discount is not found
  }
  res.status(200).json({
    status: 'success',
    message:' discount updated  successfully',
    data: {
      discount: updatedDiscount,
    },
  });
});
const getDiscountById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if the ID provided is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid ID provided',
    });
  }

  // Find the discount by ID
  const discount = await Discount.findById(id);

  // Check if the discount exists
  if (!discount) {
    return res.status(404).json({
      status: 'fail',
      message: 'Discount not found',
    });
  }

  // Send the discount as the response
  res.status(200).json({
    status: 'success',
    data: {
      discount,
    },
  });
});

// delete dicount 

const deleteDiscountById = catchAsync(async (req, res) => {
  const deletedDiscount = await Discount.findByIdAndDelete(req.params.id);
  if (!deletedDiscount) {
    // Handle the case where the discount is not found
  }
  res.status(200).json({
    status: 'success',
    message:' discount deleted successfully',
    data: null,
  });
});


module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscountById,
  deleteDiscountById,
};
