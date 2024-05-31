const express = require("express");
const TransactionController = require("../controllers/transactionController");
const isCompany = require("../middleware/companyMiddleware");
const isTalent = require("../middleware/talentMiddleware");
const auth = require("../middleware/auth");

const router = express.Router();
router.route("/").get(auth, TransactionController.getTransactions);
router.route("/:id").get(auth, TransactionController.getTransactionById);
router
  .route("/createPaypalOrder")
  .post(auth, isCompany, TransactionController.createPaypalOrder);
router
  .route("/createFlutterWavePayment")
  .post(auth, isCompany, TransactionController.createFlutterWavePayment);
router
  .route("/capturePaypalOrder")
  .post(auth, isCompany, TransactionController.capturePaypalOrder);
router
  .route("/createPaypalPayout")
  .post(auth, isTalent, TransactionController.createPaypalPayout);
router
  .route("/createFlutterWaveTransfer")
  .post(auth, isTalent, TransactionController.createFlutterWaveTransfer);
router.route("/getFlutterWaveBanks/:code").get(TransactionController.getFlutterWaveBanks);
module.exports = router;
