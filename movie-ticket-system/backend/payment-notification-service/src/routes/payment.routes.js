import { Router } from "express";
import {
  getAllPayments,
  getPaymentsByUserId,
  getPaymentByBookingId,
} from "../services/payment.service.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getAllPayments());
});

router.get("/user/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  res.json(getPaymentsByUserId(userId));
});

router.get("/booking/:bookingId", (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const payment = getPaymentByBookingId(bookingId);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  res.json(payment);
});

export default router;
