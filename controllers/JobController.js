const User = require('../models/userModel');
const mongoose = require('mongoose');
const JobPosting = require('../models/jobModel');
const AppError = require('./../helpers/appError');
const catchAsync = require('./../helpers/catchAsync');



// Controller function to create a new job posting
const createJobPosting = catchAsync(async (req, res) => {
  const user = await User.findOne({ _id: req.body.company_id });
  if (!user) {
    throw new AppError('No user data available for the given ID', 400);
  }

  // Create a new job posting
  const jobPosting = new JobPosting({
    company_id: req.body.company_id,
    title: req.body.title,
    description: req.body.description,
    payment: req.body.payment,
    skills: req.body.skills,
  });

  // Save the job posting to the database
  await jobPosting.save();

  // Respond with success message
  res.status(201).json({
    status: 'success',
    message: 'Job posted successfully',
  });
});

// Controller function to get all job postings
const getAllJobPostings = catchAsync(async (req, res) => {
  console.log(req)
  const jobPostings = await JobPosting.find({isActive:true}).populate("skills");
  res.status(200).json(jobPostings);
});
const getJobPostings = catchAsync(async (req,res) => {
  const {userId,role} = req.user;
  const jobPostings = await JobPosting.find({company_id:userId,isActive:true})
  res.status(200).json(jobPostings)
})
// Controller function to get a job posting by ID
const getJobPostingById = catchAsync(async (req, res) => {
  const jobPosting = await JobPosting.findOne({_id:req.params.id,isActive:true});
  if (!jobPosting) {
    throw new AppError('Job posting not found', 404);
  }
  res.status(200).json(jobPosting);
});

// Controller function to update a job posting by ID
const updateJobPostingById = catchAsync(async (req, res) => {
  const jobId = req.params.id;

  // Find the job posting by ID
  let jobPosting = await JobPosting.findOne({_id:jobId,isActive:true});
  if (!jobPosting) {
    throw new AppError('Job posting not found', 404);
  }
  if (jobPosting.company_id.toString() !== req.user.userId) {
    throw new AppError("Not Authorized to update this job",401)
  }

  // Update only the fields present in the request body
  for (const key in req.body) {
    if (Object.hasOwnProperty.call(req.body, key)) {
      jobPosting[key] = req.body[key];
    }
  }

  // Save the updated job posting
  jobPosting = await jobPosting.save();

  // Return the updated job posting
  res.status(200).json({
    status: 'success',
    message: 'Job posting updated successfully',
    jobPosting,
  });
});

// Controller function to delete a job posting by ID
const deleteJobPostingById = catchAsync(async (req, res) => {
  const deletedJobPosting = await JobPosting.findOne({_id:req.params.id,isActive:true});
  if (!deletedJobPosting) {
    throw new AppError('Job posting not found', 404);
  }
  if (deletedJobPosting.company_id.toString() !== req.user.userId && req.user.role!="admin" && req.user.role!="superadmin" ) {
    throw new AppError("Not Authorized to delete this job",401)
  }
  deletedJobPosting.isActive = false;
  await deletedJobPosting.save();
  res.status(200).json({
    status: 'success',
    message: 'Job posting deleted successfully',
  });
});

// Controller function to flag a job posting by ID
const flagJobPostingById = catchAsync(async (req, res) => {
  const jobId = req.params.id;

  // Find the job posting by ID
  let jobPosting = await JobPosting.findOne({_id:jobId,isActive:true});
  if (!jobPosting) {
    throw new AppError('Job posting not found', 404);
  }
  // if (jobPosting.company_id.toString() !== req.user.userId) {
  //   throw new AppError("Not Authorized to flagthis job this job",401)
  // }
  // Set the violatesPolicy field to true
  jobPosting.violating_policies = true;

  // Save the updated job posting
  jobPosting = await jobPosting.save();

  // Return the updated job posting
  res.status(200).json({
    status: 'success',
    message: 'Job posting updated successfully',
    jobPosting,
  });
});

// Controller function to un-flag a job posting by ID
const UnflagJobPostingById = catchAsync(async (req, res) => {
  const jobId = req.params.id;

  // Find the job posting by ID
  let jobPosting = await JobPosting.findOne({_id:jobId,isActive:true});
  if (!jobPosting) {
    throw new AppError('Job posting not found', 404);
  }
  // if (jobPosting.company_id.toString() !== req.user.userId) {
  //   throw new AppError("Not Authorized to flagthis job this job",401)
  // }
  // Set the violatesPolicy field to false 
  jobPosting.violating_policies = false;

  // Save the updated job posting
  jobPosting = await jobPosting.save();

  // Return the updated job posting
  res.status(200).json({
    status: 'success',
    message: 'Job posting updated successfully',
    jobPosting,
  });
});

module.exports = {
  createJobPosting,
  getAllJobPostings,
  getJobPostings,
  getJobPostingById,
  updateJobPostingById,
  deleteJobPostingById,
  flagJobPostingById,
  UnflagJobPostingById
};
