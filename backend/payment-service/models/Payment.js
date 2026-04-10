const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["COD", "BANKING"], required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);