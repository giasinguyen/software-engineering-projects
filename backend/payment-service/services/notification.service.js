const notify = ({ userId, orderId, method }) => {
  const msg = `[NOTIFICATION] User ${userId} đã đặt đơn #${orderId} thành công (${method})`;
  console.log("\n" + "=".repeat(60));
  console.log(msg);
  console.log("=".repeat(60) + "\n");

  // TODO: sau này có thể POST sang notification service riêng
  // await axios.post(`${NOTIFICATION_SERVICE}/notify`, { userId, orderId });
};

module.exports = { notify };