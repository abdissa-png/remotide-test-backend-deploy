const Contract = require("../models/ContractModel");
const mongoose = require("mongoose");
const CompanyProfile = require("../models/companyProfileModel");
const talentprofile = require("../models/talentProfileModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("../helpers/appError");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const path = require("path");
const multer = require("multer");
const { upload, staticFilePath } = require("../helpers/fileUpload");
const catchAsync = require("./../helpers/catchAsync");
const {FRONTEND_URL} =require("./../config")
//const PDFGenerator = require('../utils/PDFGenerator');
const createContract = catchAsync(async (req, res) => {
  let additionalDocuments;
  let complianceDocuments;
  let body;

  // Handle file upload
  await new Promise((resolve, reject) => {
    upload.fields([
      { name: "additionalDocuments", maxCount: 1 },
      { name: "complianceDocuments", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return reject(new AppError("Error uploading file", 500));
      } else if (err) {
        return reject(new AppError("An unexpected error occurred", 500));
      }

      if (req?.files?.additionalDocuments) {
        additionalDocuments = req?.files?.additionalDocuments[0];
      }

      if (req?.files?.complianceDocuments) {
        complianceDocuments = req?.files?.complianceDocuments[0];
      }

      if (!req?.body?.values) {
        // Handle the case where req.body.values is missing or undefined
        console.log("No values provided in the request body");
      } else {
        body = JSON.parse(req.body.values);
      }

      resolve(); // Resolve the promise after file upload
    });
  });

  try {
    const { contractType } = body;

    // Validate contract type
    if (!["Fixed", "Pay As You Go"].includes(contractType)) {
      return res.status(400).json({ message: "Invalid contract type" });
    }

    const company = await CompanyProfile.findOne({ userId: body.companyId });
    if (!company) {
      throw new AppError("No user data available for the given ID", 400);
    }
    const user = await User.findById({ _id: body.companyId });

    // Create contract
    const contractData = body;
    contractData.companyName = user.name;
    if (complianceDocuments) {
      contractData.complianceDocuments = `${staticFilePath}/${path.basename(
        complianceDocuments.path
      )}`;
    }
    if (additionalDocuments) {
      contractData.additionalDocuments = `${staticFilePath}/${path.basename(
        additionalDocuments.path
      )}`;
    }
    console.log(contractData);
    const contract = await Contract.create(contractData);

    // Return success response
    return res.status(201).json({ contract });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
});
const getContracts = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  var contracts = [];
  if (role == "admin" || role == "superadmin") {
    contracts = await Contract.find({ isDeleted: false });
  } else if (role == "talent") {
    contracts = await Contract.find({
      talentId: userId,
      isDeleted: false,
    });
  } else if (role == "company") {
    contracts = await Contract.find({
      companyId: userId,
      isDeleted: false,
    });
  }
  return res.status(200).json({ status: "success", data: contracts });
});
// get all contracts
const getAllContracts = catchAsync(async (req, res) => {
  const contracts = await Contract.find({ isDeleted: false });
  return res.status(200).json({ status: "success", data: contracts });
});
// Get contract by id
const getContractById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const contract = await Contract.findById(id);
  if (!contract) {
    return res.status(404).json({ message: "Contract not found" });
  }
  return res.status(200).json({ status: "success", data: contract });
});

const getContractsByCompanyID = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const contracts = await Contract.find({
    companyId: userId,
    isDeleted: false,
  });
  return res.status(200).json({ status: "success", data: contracts });
});

// Get contracts by talent ID
const getContractsByTalentID = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const contracts = await Contract.find({ talentId: userId, isDeleted: false });
  return res.status(200).json({ status: "success", data: contracts });
});

// Delete contract if status is unsigned
const deleteContract = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {userId} = req.user;
  const currentcontract = await Contract.findById(id);
  if (!currentcontract) {
    return res.status(404).json({ message: "Contract not found" });
  }
  if (currentcontract.companyId.toString() != userId) {
    return res.status(401).json({ message: "You are unauthorized to delete this contract." });
  }
  if (currentcontract.status !== "Unsigned") {
    return res.status(403).json({
      status: "unsuccessfull",
      message:
        "Contract cannot be deleted.only unsigned contracts can be deleted",
    });
  }
  currentcontract.isDeleted = true;
  await currentcontract.save();
  return res.status(200).json({ message: "Contract deleted successfully" });
});
// sign contract
const signContract = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user; // Assuming talent profile is obtained from the token
  const user = await User.findById(userId);
  const talentProfile = await talentprofile.findOne({ userId });
  const contract = await Contract.findById(id);
  if (!talentProfile) {
    return res.status(404).json({ message: "Talent not found" });
  }
  if (!contract) {
    return res.status(404).json({ message: "Contract not found" });
  }
  if (contract.status != "Unsigned") {
    return res.status(404).json({ message: "Contract is already signed" });
  }

  //contract.status = 'OnProgress';
  contract.talentId = userId;
  // Fill talent's signature and set contract start date
  contract.signature.talent = {
    name: user.name,
    date: new Date(), // Use current date and time
    location: `${talentProfile.city} ${talentProfile.country}`,
  };
  contract.status = "OnProgress";
  // Set contract start date to current date and time
  // contract.contractStartDate = new Date();

  await contract.save();
  // Automatically create an invoice for fixed_contract
  if (contract.contractType === "Fixed") {
    let prefix = "Invoice for";
    var issueDate = new Date(contract.workStartDate);
    console.log(contract.paymentDetail.fixed.paymentFrequency);
    if (contract.paymentDetail.fixed.paymentFrequency == "Monthly") {
      issueDate.setMonth(issueDate.getMonth() + 1);
    }
    if (contract.paymentDetail.fixed.paymentFrequency == "Weekly") {
      issueDate.setDate(issueDate.getDate() + 7);
    }
    var dueDate = new Date(issueDate.getTime());
    dueDate.setDate(dueDate.getDate() + contract.paymentDue )
    const newInvoice = await Invoice.create({
      invoiceName: `${prefix} ${contract.contractName}`, // Corrected template literal usage
      companyId: contract.companyId,
      talentId: req.user.userId,
      contractId: new mongoose.Types.ObjectId({ id }),
      amount: contract?.paymentDetail?.fixed?.payment,
      clientAddress: `${talentProfile.city} ${talentProfile.country}`,
      issueDate: issueDate,
      dueDate: dueDate,
    });
    console.log("Invoice created:", newInvoice);
  }
  // responce
  return res.status(200).json({
    status: "success",
    message: "Contract signed successfully",
    data: contract,
  });
});

const sendInvitationToTalent = catchAsync(async (req, res) => {
  const { email, description } = req.body;
  const { id } = req.params;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Talent not found" });
  }

  const contract = await Contract.findById(id);
  if (!contract) {
    return res.status(404).json({ message: "Contract not found" });
  }

  const company = await CompanyProfile.findOne({
    userId: contract.companyId,
  });
  // Fill company's signature and set contract start date
  contract.signature.company = {
    name: company.name,
    date: new Date(), // Use current date and time
    location: contract.registrationAddress,
  };

  await contract.save();
  console.log(process.env.EMAIL_USERNAME);
  const name = user.name;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "remotide.com",
    to: email,
    subject: "Invitation to Sign Contract",
    html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to Sign Contract</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h2 {
                font-weight: bold;
                color: #333333;
                margin-top: 0;
              }
              p {
                color: #666666;
                margin-bottom: 10px;
              }
              a {
                color: #007bff;
                text-decoration: none;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #007bff;
                color: #ffffff;
                border-radius: 5px;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Hello <span style="font-weight: bold;">${name}</span>,</h2>
              <p>You have been invited to sign a contract.</p>
              <p>${description}</p>
              <p>Please click on the following link to accept:</p>
              <a class="button" href="${FRONTEND_URL}/contract/${id}">Accept Contract</a>
            </div>
          </body>
          </html>
        `,
  };

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.error("Error sending invitation email:", err);
      return res
        .status(500)
        .json({ message: "Failed to send invitation email" });
    } else {
      console.log("Invitation email sent:", info);
      return res
        .status(200)
        .json({ message: "Invitation email sent successfully" });
    }
  });
});

module.exports = {
  createContract,
  deleteContract,
  getContractById,
  getContracts,
  getAllContracts,
  getContractsByCompanyID,
  getContractsByTalentID,
  signContract,
  sendInvitationToTalent,
  // downloadContractAsPDF
};
