const express = require("express");
const router = require('express').Router();

const {
    createVNPay,
    vnpayReturn
} = require("../controllers/payment");

router.post("/create-vnpay", createVNPay);

router.get("/vnpay-return", vnpayReturn);

module.exports = router;