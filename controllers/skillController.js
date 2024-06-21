const Skill = require("../models/skillModel");
const AppError = require("./../helpers/appError");
const catchAsync = require("./../helpers/catchAsync");

// Create a new skill
const createSkills = catchAsync(async (req, res) => {
  const newSkill = await Skill.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      skill: newSkill,
    },
  });
});

// Get all skills
const getAllSkills = catchAsync(async (req, res) => {
  const skills = await Skill.find();
  res.status(200).json({ status: "success", skills });
});

// Get a skill by ID
const getSkillById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const skill = await Skill.findById(id);
  if (!skill) {
    throw new AppError("Skill not found", 404);
  }
  res.status(200).json({ status: "success", skill });
});

// Update a skill by ID
const updateSkillById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const updatedSkill = await Skill.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  );
  if (!updatedSkill) {
    throw new AppError("Skill not found", 404);
  }
  res.status(200).json({
    status: "success",
    message: "Skill updated successfully",
    updatedSkill,
  });
});

// Delete a skill by ID
const deleteSkillById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deletedSkill = await Skill.findByIdAndDelete(id);
  if (!deletedSkill) {
    throw new AppError("Skill not found", 404);
  }
  res
    .status(200)
    .json({ status: "success", message: "Skill deleted successfully" });
});

module.exports = {
  createSkills,
  getAllSkills,
  getSkillById,
  updateSkillById,
  deleteSkillById,
};
