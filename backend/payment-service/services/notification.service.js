const logger = require("../utils/logger");

const notify = ({ userId, orderId, method }) => {
  logger.info("Payment notification sent", { userId, orderId, method });

  // TODO: sau này có thể POST sang notification service riêng
  // await axios.post(`${NOTIFICATION_SERVICE}/notify`, { userId, orderId });
};

module.exports = { notify };