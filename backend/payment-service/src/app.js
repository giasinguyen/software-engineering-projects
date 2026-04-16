require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const paymentRoutes = require("../routes/payment.routes");
const logger = require("../utils/logger");

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start + "ms",
    });
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => res.json({ status: "UP" }));

app.use(paymentRoutes);

const PORT = process.env.PORT || 8084;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    logger.info("Payment Service started", { port: PORT });
  });
}).catch((err) => {
  logger.error("Failed to connect to MongoDB", { error: err.message });
  process.exit(1);
});