const Invoice = require("../models/invoiceModel");
const CompanyProfile = require("../models/companyProfileModel");
const user = require("../models/userModel");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const catchAsync = require("./../helpers/catchAsync");
const Contract = require("../models/contractModel");
const TalentProfile = require("../models/talentProfileModel");

const getInvoices = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  let invoices = [];
  if (role == "talent") {
    invoices = await Invoice.find({ talentId: userId })
      .populate("companyId")
      .populate("talentId")
      .populate("contractId");
  } else if (role == "company") {
    invoices = await Invoice.find({ companyId: userId })
      .populate("companyId")
      .populate("talentId")
      .populate("contractId");
  } else if (role == "admin" || role == "superadmin") {
    invoices = await Invoice.find()
      .populate("companyId")
      .populate("talentId")
      .populate("contractId");
  }
  invoices = invoices.map((invoice) => {
    return {
      _id: invoice._id,
      invoiceName: invoice.invoiceName,
      status: invoice.status,
      amount: invoice.amount,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      companyId: invoice.companyId._id,
      talentId: invoice.talentId._id,
      contractId: invoice.contractId._id,
      company: { name: invoice.companyId.name, email: invoice.companyId.email },
      talent: { name: invoice.talentId.name, email: invoice.talentId.email },
      contract: {
        name: invoice.contractId.contractName,
        type: invoice.contractId.contractType,
        currency: invoice.contractId.paymentCurrency,
      },
    };
  });

  // console.log(invoices);
  res.status(200).json({ status: "success", data: invoices });
});

// Get invoices with talentId (filter out fully paid in frontend)
const getInvoicesByTalentId = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const invoices = await Invoice.find({ talentId: userId });
  res.status(200).json({ status: "success", data: invoices });
});

// Get invoices with companyId (filter out fully paid in frontend)
const getInvoicesByCompanyId = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const invoices = await Invoice.find({ companyId: userId });
  res.status(200).json({ status: "success", data: invoices });
});

// Get invoice by id
const getInvoiceById = catchAsync(async (req, res) => {
  const { id } = req.params;

  let invoice = await Invoice.findById(id)
    .populate("companyId")
    .populate("talentId")
    .populate("contractId");
  invoice = {
    _id: invoice._id,
    invoiceName: invoice.invoiceName,
    status: invoice.status,
    amount: invoice.amount,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    companyId: invoice.companyId._id,
    talentId: invoice.talentId._id,
    contractId: invoice.contractId._id,
    company: { name: invoice.companyId.name, email: invoice.companyId.email },
    talent: { name: invoice.talentId.name, email: invoice.talentId.email },
    contract: {
      name: invoice.contractId.contractName,
      type: invoice.contractId.contractType,
      currency: invoice.contractId.paymentCurrency,
    },
  };
  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }
  res.status(200).json({ status: "success", data: invoice });
});
const createInvoice = catchAsync(async (req, res) => {
  const { contractId, invoiceName, workHours } = req.body;
  const contract = await Contract.findById(contractId);
  const today = new Date();
  if (contract.contractType == "Pay As You Go") {
    const minHourForPayment = contract.paymentDetail.payAsYouGo.minimumHourForPayment;
    const hourlyRate = contract.paymentDetail.payAsYouGo.hourlyRate;
    const dueDate = new Date(today.getTime());
    dueDate.setDate(dueDate.getDate()+contract.paymentDue)
    if (workHours >= minHourForPayment) {
      const invoice = await Invoice.create({
        invoiceName: invoiceName,
        contractId: contractId,
        amount: hourlyRate * workHours,
        companyId: contract.companyId,
        talentId: contract.talentId,
        issueDate: today,
        dueDate: dueDate
      });
      return res.status(201).json({ status: "success", data: invoice });
    } else {
      return res.status(400).json({message:`Submitted work hours must be higher or equal to the minimum work hour for payment stipulated in the contract (${minHourForPayment} Hours)`})
    }
  } else {
    return res.status(400).json({message:"You can't issue invoices for fixed contracts, it is automatically handled by our system"})
  }
});

module.exports = {
  getInvoices,
  getInvoicesByTalentId,
  getInvoicesByCompanyId,
  getInvoiceById,
  createInvoice,
};