const express = require("express");
const ContractController = require("./../controllers/ContractController");
const isCompany = require("../middleware/companyMiddleware");
const isTalent = require("../middleware/talentMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const auth = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .post(auth,isCompany,ContractController.createContract)
  .get(auth, ContractController.getContracts);

router
  .route("/allContracts")
  .get(auth, isAdmin, ContractController.getAllContracts);

router
  .route("/company")
  .get(auth, isCompany, ContractController.getContractsByCompanyID);

router
  .route("/talent")
  .get(auth, isTalent, ContractController.getContractsByTalentID);

router
  .route("/:id")
  .post(auth,isCompany,ContractController.sendInvitationToTalent)
  .get(auth,ContractController.getContractById)
  .delete(auth,isCompany,ContractController.deleteContract);

router.route("/sign/:id").post(auth, isTalent, ContractController.signContract);

module.exports = router;
