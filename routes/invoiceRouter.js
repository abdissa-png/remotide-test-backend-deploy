const express = require("express");
const router = express.Router();
const InvoiceController = require("../controllers/invoiceController");
const isCompany = require("../middleware/companyMiddleware");
const isTalent = require("../middleware/talentMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const auth = require("../middleware/auth");

router
  .route("/")
  .get(auth, InvoiceController.getInvoices)
  .post(auth, isTalent, InvoiceController.createInvoice);

router.route("/:id").get(InvoiceController.getInvoiceById);
router
  .route("/talent/:talentId")
  .get(auth, isTalent, InvoiceController.getInvoicesByTalentId);
router
  .route("/company/:companyId")
  .get(auth, isCompany, InvoiceController.getInvoicesByCompanyId);

module.exports = router;
