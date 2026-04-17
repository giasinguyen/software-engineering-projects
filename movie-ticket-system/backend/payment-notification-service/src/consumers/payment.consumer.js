import { getChannel, EXCHANGE } from "../config/rabbitmq.js";

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

    const success = Math.random() < 0.7;

    if (success) {
      const paymentEvent = {
        event: "PAYMENT_COMPLETED",
        bookingId: event.bookingId,
        userId: event.userId,
        movieTitle: event.movieTitle,
        seatNumber: event.seatNumber,
      };
      channel.publish(EXCHANGE, "payment.completed", Buffer.from(JSON.stringify(paymentEvent)));
      console.log(`[Payment] Booking #${event.bookingId} → PAYMENT_COMPLETED`);
    } else {
      const failEvent = {
        event: "BOOKING_FAILED",
        bookingId: event.bookingId,
        userId: event.userId,
        reason: "Payment declined",
      };
      channel.publish(EXCHANGE, "booking.failed", Buffer.from(JSON.stringify(failEvent)));
      console.log(`[Payment] Booking #${event.bookingId} → BOOKING_FAILED`);
    }

    channel.ack(msg);
  });
}
