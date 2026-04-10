const router = require("express").Router();
const { createPayment, getPayments } = require("../controllers/payment.controller");

router.post("/payments", createPayment);
router.get("/payments", getPayments);

module.exports = router;