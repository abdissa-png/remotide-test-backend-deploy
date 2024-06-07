const User = require("../models/userModel");
const Withdrawal = require("../models/withdrawalModel");
const Contract = require("../models/contractModel");
const Transaction = require("../models/transactionModel");
const Balance = require("../models/balanceModel");
const Invoice = require("../models/invoiceModel");
const AppError = require("./../helpers/appError");
const catchAsync = require("./../helpers/catchAsync");
const uuid = require("uuid");
const {
  PAYPAL_BASE,
  FLW_BASE,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  FLW_PUBLIC_KEY,
  FLW_SECRET_KEY,
} = require("./../config");
const { FRONTEND_URL } = require("./../config");

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
  const tx_ref = uuid.v4()
  const body = {
    tx_ref: tx_ref,
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
        transactionMethod: "Paypal",
        transactionType: "Payment",
        talentId: invoiceDetails.talentId,
        companyId: invoiceDetails.companyId,
      });
      invoiceDetails.status = "Fully Paid";
      await invoiceDetails.save();
      const paymentDetails =
        jsonResponse.purchase_units[0].payments.captures[0]
          .seller_receivable_breakdown;
      const totalReceivable =
        Number(paymentDetails?.net_amount.value) ||
        Number(paymentDetails?.net_amount.value);
      const currency =
        paymentDetails.net_amount.currency_code ||
        paymentDetails.net_amount.currency_code;
      await Balance.findOneAndUpdate(
        { talentId: invoiceDetails.talentId },
        { $inc: { [`balance.${currency}`]: totalReceivable } },
        { upsert: true }
      );
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

const checkWithdrawalValidity = async (amount, currency, userId) => {
  if (!amount || !currency || !userId) {
    throw new AppError("Invalid withdrawal details", 400);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const userBalance = await Balance.findOne({ talentId: userId });
  if (!userBalance) {
    throw new AppError("Balance not found", 404);
  }
  if (!userBalance.balance[currency]) {
    throw new AppError("Invalid currency", 400);
  }
  if (userBalance.balance[currency] < amount) {
    throw new AppError("Insufficient balance", 400);
  }

  return { user, userBalance };
};

const createPaypalPayout = catchAsync(async (req, res) => {
  const { userId, role } = req.user;
  const { amount, currency } = req.body;
  const { user, userBalance } = await checkWithdrawalValidity(
    amount,
    currency,
    userId
  );
  const accessToken = await generateAccessToken();
  console.log(userId)
  // Retrieve the withdrawal method for the talent user
  const withdrawalMethod = await Withdrawal.findOne({
    userId: user._id,
    method: "Paypal",
  });

  if (!withdrawalMethod) {
    throw new AppError(
      "You don't have a Paypal Withdrawal Method registered.",
      400
    );
  }
  const payoutPayeeEmail = withdrawalMethod.accountDetails.paypalEmail; // Payee email (talent)
  const payoutId = uuid.v4();
  const payoutCreateParams = {
    sender_batch_header: {
      sender_batch_id: payoutId,
      email_subject: `Payout for ${amount} ${currency}`,
      email_message:
        "You have received a payout! Thanks for using our service!",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount,
          currency: currency,
        },
        receiver: payoutPayeeEmail, // Payee email
        note: `Transaction made to withdraw ${amount} ${currency} on ${new Date().toString()} by ${
          user.name
        }`, // Optional note
        sender_item_id: payoutId,
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
      var payout = await fetch(jsonResponse.links[0].href, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payoutJson = await payout.json()
      console.log(payoutJson.items[0].payout_item)
      const value = Number(payoutJson.items[0].payout_item.amount.value)
      const valCurrency = payoutJson.items[0].payout_item.amount.currency
      const fee = Number(payoutJson.items[0].payout_item_fee.value)
      const feeCurrency = payoutJson.items[0].payout_item_fee.currency

      await Transaction.create({
        talentId: userId,
        transactionDetails: payoutJson.items[0],
        transactionMethod: "Paypal",
        transactionType: "Withdrawal",
        withdrawalId: withdrawalMethod._id,
      });
      userBalance.balance[valCurrency] -= value;
      userBalance.balance[feeCurrency] -= fee;
      await userBalance.save();
    }
    return res
      .status(response.status)
      .json({ status: "success", data: jsonResponse });
  } catch (err) {
    console.log("New Error",err)
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
    if (transaction.transactionType == "Payment") {
      var paymentDetails;
      if (transaction.transactionMethod == "Paypal") {
        paymentDetails =
          transaction.transactionDetails.purchase_units[0].payments.captures[0]
            .seller_receivable_breakdown;
      }
      if (transaction.transactionMethod == "FlutterWave") {
        paymentDetails = {
          amount: transaction.transactionDetails.amount,
          currency: transaction.transactionDetails.currency,
          charged_amount: transaction.transactionDetails.charged_amount,
          app_fee: transaction.transactionDetails.app_fee,
          amount_settled: transaction.transactionDetails.amount_settled,
        };
      }
      return {
        _id: transaction._id,
        name: transaction.invoiceId.invoiceName,
        amount: transaction.invoiceId.amount,
        companyId: transaction.invoiceId.companyId,
        talentId: transaction.invoiceId.talentId,
        contractId: transaction.invoiceId.contractId,
        invoiceId: transaction.invoiceId._id,
        transactionMethod: transaction.transactionMethod,
        transactionType: transaction.transactionType,
        createdAt: transaction.createdAt,
        paymentDetails: paymentDetails,
      };
    } else {
      var paymentDetails;
      var name;
      var amount
      if (transaction.transactionMethod == "Paypal") {
        name= transaction.transactionDetails.payout_item.note
        amount = Number(transaction.transactionDetails.payout_item.amount.value)
        currency = Number(transaction.transactionDetails.payout_item.amount.currency)
        fee = Number(transaction.transactionDetails.payout_item_fee.value)
        paymentDetails = {
          amount: amount,
          currency: currency,
          app_fee: fee,
          amount_settled: amount + fee,
        };
      }
      if (transaction.transactionMethod == "FlutterWave") {
        name = transaction.transactionDetails.narration
        amount = Number(transaction.transactionDetails.amount)
        currency = transaction.transactionDetails.currency
        fee = transaction.transactionDetails.fee
        paymentDetails = {
          amount: amount,
          currency: currency,
          app_fee: fee,
          amount_settled: amount + fee,
        };
      }
      return {
        _id: transaction._id,
        name: name,
        amount: amount,
        talentId: transaction.talentId,
        transactionMethod: transaction.transactionMethod,
        transactionType: transaction.transactionType,
        createdAt: transaction.createdAt,
        paymentDetails: paymentDetails,
      };
    }
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
  if (transaction.transactionType == "Payment") {
    var paymentDetails;
    if (transaction.transactionMethod == "Paypal") {
      paymentDetails =
        transaction.transactionDetails.purchase_units[0].payments.captures[0]
          .seller_receivable_breakdown;
    }
    if (transaction.transactionMethod == "FlutterWave") {
      paymentDetails = {
        amount: transaction.transactionDetails.amount,
        currency: transaction.transactionDetails.currency,
        charged_amount: transaction.transactionDetails.charged_amount,
        app_fee: transaction.transactionDetails.app_fee,
        amount_settled: transaction.transactionDetails.amount_settled,
      };
    }
    transaction = {
      _id: transaction._id,
      name: transaction.invoiceId.invoiceName,
      amount: transaction.invoiceId.amount,
      companyId: transaction.invoiceId.companyId,
      talentId: transaction.invoiceId.talentId,
      contractId: transaction.invoiceId.contractId,
      invoiceId: transaction.invoiceId._id,
      transactionMethod: transaction.transactionMethod,
      transactionType: transaction.transactionType,
      createdAt: transaction.createdAt,
      paymentDetails: paymentDetails,
    };
  } else {
    var paymentDetails;
      var name;
      var amount
      if (transaction.transactionMethod == "Paypal") {
        name= transaction.transactionDetails.payout_item.note
        amount = Number(transaction.transactionDetails.payout_item.amount.value)
        currency = transaction.transactionDetails.payout_item.amount.currency
        fee = Number(transaction.transactionDetails.payout_item_fee.value)
        paymentDetails = {
          amount: amount,
          currency: currency,
          app_fee: fee,
          amount_settled: amount + fee,
        };
      }
    if (transaction.transactionMethod == "FlutterWave") {
      name = transaction.transactionDetails.narration
      amount = Number(transaction.transactionDetails.amount)
      currency = transaction.transactionDetails.currency
      fee = transaction.transactionDetails.fee
      paymentDetails = {
        amount: amount,
        currency: currency,
        app_fee: fee,
        amount_settled: amount + fee,
      };
    }
    transaction = {
      _id: transaction._id,
      name: name,
      amount: amount,
      talentId: transaction.talentId,
      transactionMethod: transaction.transactionMethod,
      transactionType: transaction.transactionType,
      createdAt: transaction.createdAt,
      paymentDetails: paymentDetails,
    };
  }
  return res.status(200).json({ status: "success", data: transaction });
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
  const { userId, role } = req.user;
  const { amount, currency } = req.body;
  const { user, userBalance } = await checkWithdrawalValidity(
    amount,
    currency,
    userId
  );
  // Retrieve the withdrawal method for the talent user
  const withdrawalMethod = await Withdrawal.findOne({
    userId: user._id,
    method: "FlutterWave",
  });
  if (!withdrawalMethod) {
    throw new AppError(
      "You don't have a Flutterwave Withdrawal Method registered.",
      400
    );
  }
  const { account_number, account_bank, account_country } =
    withdrawalMethod.accountDetails;
  const transferId = uuid.v4();
  const transferCreateParams = {
    account_bank: account_bank,
    account_number: account_number,
    amount: amount,
    currency: currency,
    reference: transferId,
    narration: `Transaction made to withdraw ${amount} ${currency} on ${new Date().toString()} by ${
      user.name
    }`,
    beneficiary_name: user.name,
    beneficiary_country: account_country,
    callback_url: `https://www.flutterwave.com/${account_country}/`,
    meta: {
      sender: "Remotide",
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
    console.log(jsonResponse)
    if (response.status == 200) {
      var payoutCurrency = jsonResponse.data.currency;
      var payoutAmount = jsonResponse.data.amount;
      var payoutFee = jsonResponse.data.fee
      await Transaction.create({
        talentId: userId,
        transactionDetails: jsonResponse.data,
        transactionMethod: "FlutterWave",
        transactionType: "Withdrawal",
        withdrawalId: withdrawalMethod._id,
      });
      userBalance.balance[payoutCurrency] -= payoutAmount;
      userBalance.balance[payoutCurrency] -= payoutFee;
      await userBalance.save();
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
