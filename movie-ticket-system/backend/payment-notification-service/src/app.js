import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./consumers/payment.consumer.js";
import { startNotificationConsumer } from "./consumers/notification.consumer.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "UP", service: "payment-notification-service" });
});

app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 8084;

async function start() {
  await connectRabbitMQ();
  await startPaymentConsumer();
  await startNotificationConsumer();

  app.listen(PORT, () => {
    console.log(`[Payment+Notification] Running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
