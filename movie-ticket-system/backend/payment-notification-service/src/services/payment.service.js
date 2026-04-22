const TICKET_PRICE = 100_000; // 100,000 VND per seat
const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "E_WALLET"];

const payments = new Map(); // paymentId -> payment
let idCounter = 1;

function generateTransactionId() {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function randomPaymentMethod() {
  return PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
}

export function processPayment({ bookingId, userId, movieTitle, seatNumber }) {
  const success = Math.random() < 0.7; 
  const payment = {
    id: idCounter++,
    bookingId,
    userId,
    movieTitle,
    seatNumber,
    amount: TICKET_PRICE * seatNumber,
    currency: "VND",
    method: randomPaymentMethod(),
    transactionId: success ? generateTransactionId() : null,
    status: success ? "SUCCESS" : "FAILED",
    failureReason: success ? null : "Payment declined by provider",
    createdAt: new Date().toISOString(),
  };

  payments.set(payment.id, payment);
  return payment;
}

export function getPaymentByBookingId(bookingId) {
  for (const p of payments.values()) {
    if (p.bookingId === bookingId) return p;
  }
  return null;
}

export function getPaymentsByUserId(userId) {
  return [...payments.values()]
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAllPayments() {
  return [...payments.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}
