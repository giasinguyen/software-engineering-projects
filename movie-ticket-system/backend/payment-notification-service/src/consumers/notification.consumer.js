import { getChannel, EXCHANGE } from "../config/rabbitmq.js";

const QUEUE = "notification.queue";
const BINDING_KEY = "payment.completed";

export async function startNotificationConsumer() {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, BINDING_KEY);

  console.log("[Notification] Waiting for PAYMENT_COMPLETED events...");

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log(`[Notification] ✅ Booking #${event.bookingId} thành công! Movie: ${event.movieTitle}, Seat: ${event.seatNumber}`);

    channel.ack(msg);
  });
}
