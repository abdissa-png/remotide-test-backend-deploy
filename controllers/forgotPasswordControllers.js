const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const AppError=require('../helpers/appError')
const {hashPassword} = require("../helpers/auth")
const {EMAIL_USERNAME,EMAIL_PASSWORD,FRONTEND_URL} = require("./../config")

// Function to generate a random token
const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Function to send password reset email
const sendPasswordResetEmail = async (email, token) => {
  // console.log(EMAIL_USERNAME,EMAIL_PASSWORD)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD
    }
 });

  const mailOptions = {
    from: "remotide.com",
    to: email,
    subject: 'Password Reset',
    html: `
      <p>You are receiving this email because you (or someone else) has requested a password reset.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${FRONTEND_URL}/auth/resetPassword/${token}">Reset Password</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `,
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
});
};

// Controller function to handle password reset request
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email },options={strict:false});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generateToken();
    user.set('resetPasswordToken', resetToken);
    user.set('resetPasswordExpires',  Date.now() + 3600000); // Token expires in 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
};

// Controller function to handle password reset
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (password) {
      const newPassword = await hashPassword(password)
      user.password = newPassword;
    } else {
      throw new AppError("You havenot passd the new password")
    }
    user.set('resetPasswordToken', undefined);
    user.set('resetPasswordExpires', undefined);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
