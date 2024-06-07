const express = require("express");
const isTalent = require("../middleware/talentMiddleware");
const auth = require("../middleware/auth");
const BalanceController = require("./../controllers/balanceController");

const router = express.Router();

router
  .route("/")
  .get(auth,isTalent, BalanceController.getBalance);

module.exports = router;
