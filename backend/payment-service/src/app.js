require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const paymentRoutes = require("../routes/payment.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(paymentRoutes);

const PORT = process.env.PORT || 8084;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
});