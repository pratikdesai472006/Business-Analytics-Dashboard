const nodemailer = require("nodemailer");
const payments = require("./paymentService");

const sendDueReminders = async () => {
  const orders = await payments.dueForReminder();
  const transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      })
    : null;

  for (const order of orders) {
    const subject = `Payment reminder: ₹${order.amount} due ${new Date(order.due_date).toLocaleDateString()}`;
    const text = `Hello ${order.customer_name}, your payment for ${order.product} is due. Please arrange payment at your earliest convenience.`;
    if (transport && order.customer_email) {
      await transport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: order.customer_email,
        subject,
        text,
      });
    } else {
      console.log(
        `[Payment reminder ready] ${order.customer_email || order.customer_name}: ${subject}`,
      );
    }
    await payments.recordReminder(order.id);
  }
  return orders.length;
};

module.exports = { sendDueReminders };
