const axios = require("axios");
const Payment = require("../models/Payment");
const { notify } = require("../services/notification.service");

const ORDER_SERVICE = process.env.ORDER_SERVICE;

// Decode Bearer token (stub — không verify, tin tưởng client)
const decodeToken = (req) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload;
  } catch {
    return null;
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    if (!orderId || !amount || !method) {
      return res.status(400).json({ message: "orderId, amount, method là bắt buộc" });
    }

    const user = decodeToken(req);
    const userId = user?.sub || user?.id || "unknown";

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
      console.warn("[Payment] Không thể cập nhật Order Service:", err.message);
    }

    // 4. Gửi notification
    notify({ userId, orderId, method });

    res.status(201).json({ message: "Thanh toán thành công", payment });
  } catch (err) {
    console.error(err);
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