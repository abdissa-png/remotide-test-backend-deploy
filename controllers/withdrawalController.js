const User = require("../models/userModel");
const Withdrawal = require("../models/withdrawalModel");
const AppError = require("./../helpers/appError");
const catchAsync = require("./../helpers/catchAsync");

const fetchWithdrawalMethods = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const withdrawalMethods = await Withdrawal.find({ userId: userId });
  return res.status(200).json({ status: "success", data: withdrawalMethods });
});
const fetchWithdrawalMethod = catchAsync(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const withdrawalMethod = await Withdrawal.findOne({ userId: userId,_id:id });
    if (withdrawalMethod) return res.status(200).json({ status: "success", data: withdrawalMethod });
    else throw new AppError("Withdrawal method not found.",404)
});
const createWithdrawalMethod = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { method, accountDetails } = req.body;
  const user = User.findById(userId)
  if (!user) {
    throw new AppError("The user ia not found in the database",404)
  }
  const newWithdrawalMethod = await Withdrawal.create({
    userId,
    method,
    accountDetails,
  });
  return res.status(201).json({ status: "success", message:"Withdrawal method successfully registered.",  data: newWithdrawalMethod });
});

const updateWithdrawalMethod = catchAsync(async (req, res) => {
    const { userId } = req.user
    const { id } = req.params;
    const withdrawalMethod = await Withdrawal.findById(id)
    if (!withdrawalMethod) {
        throw new AppError("Withdrawal method not found.",404)
    }
    if (withdrawalMethod.userId.toString() != userId) {
        throw new AppError("Not Authorized to update this withdrawal method",401)
    }
    const { method,accountDetails } = req.body;
    withdrawalMethod.method = method
    withdrawalMethod.accountDetails = accountDetails
    await withdrawalMethod.save()
    return res.status(200).json({status:"success",message:"Withdrawal method successfully created",data:withdrawalMethod})
});

const deleteWithdrawalMethod = catchAsync(async (req, res) => {
    const { userId } = req.user
    const { id } = req.params;
    const withdrawalMethod = await Withdrawal.findById(id)
    if (!withdrawalMethod) {
        throw new AppError("Withdrawal method not found.",404)
    }
    if (withdrawalMethod.userId.toString() != userId) {
        throw new AppError("Not Authorized to delete this withdrawal method",401)
    }
    await Withdrawal.findByIdAndDelete(id)
    return res.status(200).json({status:"success",message:"Withdrawal method deleted"})
});

module.exports = {
  fetchWithdrawalMethods,
  fetchWithdrawalMethod,
  createWithdrawalMethod,
  updateWithdrawalMethod,
  deleteWithdrawalMethod,
};
