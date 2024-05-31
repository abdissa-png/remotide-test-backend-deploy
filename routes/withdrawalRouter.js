const express = require("express");
const WithdrawalController = require("./../controllers/withdrawalController");
const isTalent = require("../middleware/talentMiddleware");
const auth = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .post(auth, isTalent, WithdrawalController.createWithdrawalMethod)
  .get(auth, isTalent, WithdrawalController.fetchWithdrawalMethods);
router
  .route("/:id")
  .get(auth, isTalent, WithdrawalController.fetchWithdrawalMethod)
  .patch(auth, isTalent, WithdrawalController.updateWithdrawalMethod)
  .delete(auth, isTalent, WithdrawalController.deleteWithdrawalMethod);

module.exports = router;
