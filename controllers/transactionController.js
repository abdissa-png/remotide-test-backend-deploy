const User = require("../models/userModel");
const Withdrawal = require("../models/withdrawalModel");
const Contract = require("../models/ContractModel");
const Transaction = require("../models/transactionModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("./../helpers/appError");
const catchAsync = require("./../helpers/catchAsync");
const {
  PAYPAL_BASE,
  FLW_BASE,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  FLW_PUBLIC_KEY,
  FLW_SECRET_KEY,
} = require("./../config");
const {FRONTEND_URL} = require("./../config")

let fetch;
(async () => {
  const { default: fetchModule } = await import("node-fetch");
  fetch = fetchModule;
})();

const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");
    const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};
const paymentPreCheck = async (invoiceId, userId, role) => {
  // Retrieve invoice details from your database or data source
  const invoiceDetails = await Invoice.findById(invoiceId);
  if (!invoiceDetails) {
    throw new AppError("This invoice does not exist.", 404);
  }
  if (invoiceDetails.status == "Fully Paid") {
    throw new AppError("This invoice is already paid.", 404);
  }
  if (invoiceDetails.companyId.toString() != userId || role != "company") {
    new AppError("You are not authorized to create this payment", 401);
  }
  const companyUser = await User.findById(invoiceDetails.companyId);
  if (!companyUser) {
    throw new AppError("This company does not exist.", 404);
  }
  const talentUser = await User.findById(invoiceDetails.talentId);
  if (!talentUser) {
    throw new AppError("This talent does not exist.", 404);
  }
  const contract = await Contract.findById(invoiceDetails.contractId);
  if (!contract) {
    throw new AppError("This contract does not exist", 404);
  }
  return { invoiceDetails, companyUser, talentUser, contract };
};
const createPaypalOrder = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const { invoiceId } = req.body;
  console.log(invoiceId);
  // Precheck before proceeding to order
  const { companyUser, contract, invoiceDetails, talentUser } =
    await paymentPreCheck(invoiceId, userId, role);

  // const withdrawalMethod = await Withdrawal.findOne({
  //   userId: invoiceDetails.talentId,
  // });
  // if (!withdrawalMethod || withdrawalMethod.method != "Paypal") {
  //   throw new AppError("Payee didnot setup a paypal withdrawal method.", 400);
  // }
  const payerEmail = companyUser.email;

  const payment = {
    intent: "CAPTURE",
    payer: {
      payment_method: "paypal",
      payer_info: {
        email: payerEmail,
      },
    },
    redirect_urls: {
      return_url: `${FRONTEND_URL}/company`,
      cancel_url: `${FRONTEND_URL}/company`,
    },
    purchase_units: [
      {
        amount: {
          value: invoiceDetails.amount,
          currency_code: contract.paymentCurrency,
        },
        description: invoiceDetails.invoiceName,
        invoiceId: invoiceDetails._id,
        // payee: {
        //   email: withdrawalMethod.accountDetails.paypalEmail,
        // },
      },
    ],
    application_context: {
      shipping_preference: "NO_SHIPPING", // No shipping required for services
    },
  };

  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_BASE}/v2/checkout/orders`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: JSON.stringify(payment),
  });
  // console.log(response)
  try {
    const jsonResponse = await response.json();
    console.log(jsonResponse);
    return res.status(response.status).json(jsonResponse);
  } catch (err) {
    const errorMessage = await response.text();
    console.log(err, errorMessage);
    throw new AppError(errorMessage, 500);
  }
});
const createFlutterWavePayment = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const { invoiceId, name, email, phoneNumber } = req.body;

  // precheck before proceeding to payment
  const { companyUser, contract, invoiceDetails, talentUser } =
    await paymentPreCheck(invoiceId, userId, role);
  const body = {
    tx_ref: invoiceId,
    amount: invoiceDetails.amount.toString(),
    currency: contract.paymentCurrency,
    redirect_url: `${FRONTEND_URL}/company`,
    meta: {
      invoiceId: invoiceId,
      talentId: talentUser._id,
      companyId: companyUser._id,
    },
    customer: {
      email: email,
      phonenumber: phoneNumber,
      name: name,
    },
    customizations: {
      title: invoiceDetails.invoiceName,
    },
  };
  console.log(body);
  const response = await fetch(`${FLW_BASE}/v3/payments`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  try {
    const jsonResponse = await response.json();
    console.log(jsonResponse);
    return res
      .status(response.status)
      .json({ status: jsonResponse.status, link: jsonResponse.data.link });
  } catch (err) {
    const errorMessage = await response.text();
    console.log(err, errorMessage);
    throw new AppError(errorMessage, 500);
  }
});
const capturePaypalOrder = catchAsync(async (req, res) => {
  const { orderId, invoiceId } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;
  const { userId, role } = req.user;
  // Retrieve invoice details from your database or data source
  const invoiceDetails = await Invoice.findById(invoiceId);
  if (!invoiceDetails) {
    throw new AppError("This invoice does not exist.", 404);
  }
  if (invoiceDetails.companyId.toString() != userId || role != "company") {
    new AppError("You are not authorized to create this payment", 401);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  try {
    const jsonResponse = await response.json();
    if (response.status == 201) {
      // save the transaction that was made
      await Transaction.create({
        invoiceId: invoiceDetails._id,
        transactionDetails: jsonResponse,
        paymentMethod: "Paypal",
        talentId: invoiceDetails.talentId,
        companyId: invoiceDetails.companyId,
      });
      invoiceDetails.status = "Fully Paid";
      await invoiceDetails.save();
    }
    console.log(jsonResponse, JSON.stringify(jsonResponse), response.status);
    return res.status(response.status).json(jsonResponse);
  } catch (err) {
    console.log("Caught Error", err);
    const errorMessage = await response.text();
    console.log("Error Message", errorMessage);
    throw new AppError(errorMessage, 500);
  }
});

const createPaypalPayout = catchAsync(async (req, res) => {
  const { invoiceId, transactionId } = req.body;
  const accessToken = await generateAccessToken();
  console.log(invoiceId, transactionId);

  // Retrieve invoice details from your database or data source
  const invoiceDetails = await Invoice.findById(invoiceId);
  let transaction = await Transaction.findById(transactionId);
  if (!invoiceDetails) {
    throw new AppError("This invoice does not exist.", 404);
  }
  if (!transaction) {
    throw new AppError("This transaction does not exist.", 404);
  }
  if (transaction.withdrawalStatus == "Withdrawn") {
    throw new AppError("This transaction has been already withdrawn", 401);
  }
  // Retrieve the company user and talent user details
  const companyUser = await User.findById(invoiceDetails.companyId);
  const talentUser = await User.findById(invoiceDetails.talentId);

  // Retrieve the withdrawal method for the talent user
  const withdrawalMethod = await Withdrawal.findOne({
    userId: invoiceDetails.talentId,
    method: "Paypal",
  });

  // Validate the withdrawal method and user existence
  if (
    !companyUser ||
    !talentUser ||
    !withdrawalMethod ||
    withdrawalMethod.method !== "Paypal"
  ) {
    throw new AppError("Invalid user or withdrawal method", 400);
  }
  const contract = await Contract.findById(invoiceDetails.contractId);
  if (!contract) {
    throw new AppError("This contract does not exist", 404);
  }
  const payoutPayeeEmail = withdrawalMethod.accountDetails.paypalEmail; // Payee email (talent)
  let value, currency;
  console.log(transaction);
  if (transaction.paymentMethod == "Paypal") {
    const paymentDetails =
      transaction.transactionDetails.purchase_units[0].payments.captures[0]
        .seller_receivable_breakdown;
    if (paymentDetails?.receivable_amount) {
      value = Number(paymentDetails.receivable_amount.value);
      currency = paymentDetails.receivable_amount.currency_code;
    } else if (paymentDetails?.net_amount) {
      value = Number(paymentDetails.net_amount.value);
      currency = paymentDetails.net_amount.currency_code;
    }
  }
  if (transaction.paymentMethod == "FlutterWave") {
    value = transaction.transactionDetails.data.amount_settled;
    currency = transaction.transactionDetails.data.currency;
  }
  console.log(value, currency);
  const payoutCreateParams = {
    sender_batch_header: {
      sender_batch_id: invoiceId, // Use invoiceId as the batch ID
      email_subject: "Payout for Invoice " + invoiceDetails.invoiceName,
      email_message:
        "You have received a payout! Thanks for using our service!",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: value,
          currency: currency,
        },
        receiver: payoutPayeeEmail, // Payee email
        note: invoiceDetails.invoiceName, // Optional note
        sender_item_id: invoiceId, // Use invoiceId as the item ID
      },
    ],
  };

  const response = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payoutCreateParams),
  });

  try {
    const jsonResponse = await response.json();
    if (response.status == 201) {
      transaction.withdrawalStatus = "Withdrawn";
      transaction.withdrawalId = withdrawalMethod._id;
      await transaction.save();
    }
    return res.status(response.status).json(jsonResponse);
  } catch (err) {
    const errorMessage = await response.text();
    throw new AppError(errorMessage, 500);
  }
});

const getTransactions = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  let transactions = [];
  if (role == "talent") {
    transactions = await Transaction.find({ talentId: userId }).populate(
      "invoiceId"
    );
  } else if (role == "company") {
    transactions = await Transaction.find({ companyId: userId }).populate(
      "invoiceId"
    );
  } else if (role == "admin" || role == "superadmin") {
    transactions = await Transaction.find().populate("invoiceId");
  }

  transactions = transactions.map((transaction) => {
    var paymentDetails;
    if (transaction.paymentMethod == "Paypal") {
      paymentDetails =
        transaction.transactionDetails.purchase_units[0].payments.captures[0]
          .seller_receivable_breakdown;
    }
    if (transaction.paymentMethod == "FlutterWave") {
      paymentDetails = {
        amount: transaction.transactionDetails.data.amount,
        currency: transaction.transactionDetails.data.currency,
        charged_amount: transaction.transactionDetails.data.charged_amount,
        app_fee: transaction.transactionDetails.data.app_fee,
        amount_settled: transaction.transactionDetails.data.amount_settled,
      };
    }
    return {
      _id: transaction._id,
      invoiceName: transaction.invoiceId.invoiceName,
      amount: transaction.invoiceId.amount,
      companyId: transaction.invoiceId.companyId,
      talentId: transaction.invoiceId.talentId,
      contractId: transaction.invoiceId.contractId,
      invoiceId: transaction.invoiceId._id,
      withdrawalStatus: transaction.withdrawalStatus,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt,
      paymentDetails: paymentDetails,
    };
  });

  // console.log(invoices);
  res.status(200).json({ status: "success", data: transactions });
});

const getTransactionById = catchAsync(async (req, res) => {
  const { id } = req.params;

  let transaction = await Transaction.findById(id).populate("invoiceId");
  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found." });
  }
  var paymentDetails;
  if (transaction.paymentMethod == "Paypal") {
    paymentDetails =
      transaction.transactionDetails.purchase_units[0].payments.captures[0]
        .seller_receivable_breakdown;
  }
  if (transaction.paymentMethod == "FlutterWave") {
    paymentDetails = {
      amount: transaction.transactionDetails.data.amount,
      currency: transaction.transactionDetails.data.currency,
      charged_amount: transaction.transactionDetails.data.charged_amount,
      app_fee: transaction.transactionDetails.data.app_fee,
      amount_settled: transaction.transactionDetails.data.amount_settled,
    };
  }
  transaction = {
    _id: transaction._id,
    invoiceName: transaction.invoiceId.invoiceName,
    amount: transaction.invoiceId.amount,
    companyId: transaction.invoiceId.companyId,
    talentId: transaction.invoiceId.talentId,
    contractId: transaction.invoiceId.contractId,
    invoiceId: transaction.invoiceId._id,
    withdrawalStatus: transaction.withdrawalStatus,
    paymentMethod: transaction.paymentMethod,
    createdAt: transaction.createdAt,
    paymentDetails: paymentDetails,
  };

  res.status(200).json({ status: "success", data: transaction });
});

const getFlutterWaveBanks = catchAsync(async (req, res) => {
  const { code } = req.params;
  console.log(code);
  const response = await fetch(`${FLW_BASE}/v3/banks/${code}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
    },
    method: "GET",
  });

  try {
    const jsonResponse = await response.json();
    return res.status(response.status).json(jsonResponse);
  } catch (err) {
    const errorMessage = await response.text();
    throw new AppError(errorMessage, 500);
  }
});
const createFlutterWaveTransfer = catchAsync(async (req, res) => {
  const { invoiceId, transactionId } = req.body;
  console.log(invoiceId, transactionId);

  // Retrieve invoice details from your database or data source
  const invoiceDetails = await Invoice.findById(invoiceId);
  let transaction = await Transaction.findById(transactionId);
  if (!invoiceDetails) {
    throw new AppError("This invoice does not exist.", 404);
  }
  if (!transaction) {
    throw new AppError("This transaction does not exist.", 404);
  }
  if (transaction.withdrawalStatus == "Withdrawn") {
    throw new AppError("This transaction has been already withdrawn", 401);
  }
  // Retrieve the company user and talent user details
  const companyUser = await User.findById(invoiceDetails.companyId);
  const talentUser = await User.findById(invoiceDetails.talentId);

  // Retrieve the withdrawal method for the talent user
  const withdrawalMethod = await Withdrawal.findOne({
    userId: invoiceDetails.talentId,
    method: "FlutterWave",
  });

  // Validate the withdrawal method and user existence
  if (
    !companyUser ||
    !talentUser ||
    !withdrawalMethod ||
    withdrawalMethod.method !== "FlutterWave"
  ) {
    throw new AppError("Invalid user or withdrawal method", 400);
  }
  const contract = await Contract.findById(invoiceDetails.contractId);
  if (!contract) {
    throw new AppError("This contract does not exist", 404);
  }
  const {account_number,account_bank,account_country} = withdrawalMethod.accountDetails;
  let value, currency;
  if (transaction.paymentMethod == "Paypal") {
    const paymentDetails =
      transaction.transactionDetails.purchase_units[0].payments.captures[0]
        .seller_receivable_breakdown;
    if (paymentDetails?.receivable_amount) {
      value = Number(paymentDetails.receivable_amount.value);
      currency = paymentDetails.receivable_amount.currency_code;
    } else if (paymentDetails?.net_amount) {
      value = Number(paymentDetails.net_amount.value);
      currency = paymentDetails.net_amount.currency_code;
    }
  }
  if (transaction.paymentMethod == "FlutterWave") {
    value = transaction.transactionDetails.data.amount_settled;
    currency = transaction.transactionDetails.data.currency;
  }
  const transferCreateParams = {
    account_bank: account_bank,
    account_number: account_number,
    amount: value,
    currency: currency,
    reference: invoiceId,
    narration: "Payment for "+invoiceDetails.invoiceName,
    beneficiary_name: talentUser.name,
    beneficiary_country: account_country,
    callback_url:`https://www.flutterwave.com/${account_country}/`,
    meta:{
      sender:companyUser.name,
      sender_email_address:companyUser.email,
    },
  };

  const response = await fetch(`${FLW_BASE}/v3/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
    },
    body: JSON.stringify(transferCreateParams),
  });

  try {
    const jsonResponse = await response.json();
    if (response.status == 200) {
      transaction.withdrawalStatus = "Withdrawn";
      transaction.withdrawalId = withdrawalMethod._id;
      await transaction.save();
    }
    return res.status(response.status).json(jsonResponse);
  } catch (err) {
    const errorMessage = await response.text();
    throw new AppError(errorMessage, 500);
  }
});

module.exports = {
  createPaypalOrder,
  createPaypalPayout,
  capturePaypalOrder,
  getTransactions,
  getTransactionById,
  createFlutterWavePayment,
  createFlutterWaveTransfer,
  getFlutterWaveBanks,
};
