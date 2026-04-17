import amqplib from "amqplib";

const EXCHANGE = "movie.ticket.exchange";

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  connection = await amqplib.connect(process.env.RABBITMQ_URI);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("[RabbitMQ] Connected");
  return channel;
}

export function getChannel() {
  return channel;
}

export { EXCHANGE };
