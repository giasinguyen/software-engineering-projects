const axios = require("axios");
const jwt = require("jsonwebtoken");
const Payment = require("../models/Payment");
const { notify } = require("../services/notification.service");
const logger = require("../utils/logger");

const ORDER_SERVICE = process.env.ORDER_SERVICE;
const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token — trả về payload hoặc null nếu invalid
const verifyToken = (req) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.warn("JWT verification failed", { error: err.message });
    return null;
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    if (!orderId || !amount || !method) {
      return res.status(400).json({ message: "orderId, amount, method là bắt buộc" });
    }

    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized — token không hợp lệ" });
    }
    const userId = user.sub || user.id || "unknown";

    // 1. Lưu payment với trạng thái PENDING
    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      method,
      status: "PENDING",
    });

    // 2. Giả lập xử lý thanh toán (luôn SUCCESS)
    payment.status = "SUCCESS";
    await payment.save();

    // 3. Gọi Order Service cập nhật trạng thái đơn hàng → CONFIRMED + đồng bộ paymentMethod
    try {
      await axios.put(
        `${ORDER_SERVICE}/orders/${orderId}/status`,
        { status: "CONFIRMED", paymentMethod: method },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      logger.warn("Không thể cập nhật Order Service", { orderId, error: err.message });
    }

    // 4. Gửi notification
    notify({ userId, orderId, method });

    res.status(201).json({ message: "Thanh toán thành công", payment });
  } catch (err) {
    logger.error("Payment creation failed", { error: err.message });
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};