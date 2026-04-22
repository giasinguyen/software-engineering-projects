import amqplib from "amqplib";

const EXCHANGE = "movie.ticket.exchange";

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  const connectionOptions = {
    protocol: process.env.RABBITMQ_SSL === "true" ? "amqps" : "amqp",
    hostname: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672"),
    username: process.env.RABBITMQ_USERNAME || "guest",
    password: process.env.RABBITMQ_PASSWORD || "guest",
    vhost: process.env.RABBITMQ_VHOST || "/",
  };

  connection = await amqplib.connect(connectionOptions);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("[RabbitMQ] Connected to", connectionOptions.hostname);
  return channel;
}

export function getChannel() {
  return channel;
}

export { EXCHANGE };
