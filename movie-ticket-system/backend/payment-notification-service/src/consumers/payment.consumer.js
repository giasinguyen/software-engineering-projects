import { getChannel, EXCHANGE } from "../config/rabbitmq.js";
import { processPayment } from "../services/payment.service.js";

const QUEUE = "payment.queue";
const BINDING_KEY = "booking.created";

export async function startPaymentConsumer() {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, BINDING_KEY);

  console.log("[Payment] Waiting for BOOKING_CREATED events...");

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log(`[Payment] Received BOOKING_CREATED for booking #${event.bookingId}`);

    const payment = processPayment({
      bookingId: event.bookingId,
      userId: event.userId,
      movieTitle: event.movieTitle,
      seatNumber: event.seatNumber,
    });

    if (payment.status === "SUCCESS") {
      channel.publish(
        EXCHANGE,
        "payment.completed",
        Buffer.from(JSON.stringify({
          event: "PAYMENT_COMPLETED",
          bookingId: payment.bookingId,
          userId: payment.userId,
          movieTitle: payment.movieTitle,
          seatNumber: payment.seatNumber,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          transactionId: payment.transactionId,
        }))
      );
      console.log(`[Payment] #${payment.id} Booking #${payment.bookingId} → SUCCESS (${payment.method}, TXN: ${payment.transactionId})`);
    } else {
      channel.publish(
        EXCHANGE,
        "booking.failed",
        Buffer.from(JSON.stringify({
          event: "BOOKING_FAILED",
          bookingId: payment.bookingId,
          userId: payment.userId,
          reason: payment.failureReason,
        }))
      );
      console.log(`[Payment] #${payment.id} Booking #${payment.bookingId} → FAILED (${payment.failureReason})`);
    }

    channel.ack(msg);
  });
}
