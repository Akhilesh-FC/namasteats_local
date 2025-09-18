const express = require("express");
const { initiateCheckout, paymentSuccess,createSession,getOrderHistory } = require("../../controllers/Api/orderController");

const router = express.Router();

// 🚀 Step 1: Checkout initiate (payment session create)
router.post("/checkout_initiate", initiateCheckout);

// 🚀 Step 2: Checkout success (payment confirm → order create)
router.post("/checkout_success", paymentSuccess);
router.post("/createsession", createSession);
router.post("/getOrderHistory", getOrderHistory);

module.exports = router;
