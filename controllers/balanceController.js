const AppError = require("./../helpers/appError");
const catchAsync = require("./../helpers/catchAsync");
const Balance = require("../models/balanceModel");

const getBalance = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const balance = await Balance.findOne({ talentId: userId });
  if (!balance) {
    const newBalance = await Balance.create({ talentId: userId });
    return res.status(200).json({ status: "Success", data: newBalance });
  } else {
    return res.status(200).json({ status: "Success", data: balance });
  }
});

module.exports = {
  getBalance,
};
