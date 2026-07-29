const Order = require("../models/Order");

const listOrders = async (userId) => {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((order) => ({ id: String(order._id), customerName: order.customerName, customerEmail: order.customerEmail, product: order.product, amount: order.amount, status: order.status, dueDate: order.dueDate, paidAt: order.paidAt, createdAt: order.createdAt }));
};
const createOrder = async (data) => {
  const order = await Order.create(data);
  return { insertId: String(order._id) };
};
const getOrder = async (id, userId) => {
  const order = await Order.findOne({ _id: id, userId }).lean();
  if (!order) return [];
  return [{ id: String(order._id), customer_name: order.customerName, customer_email: order.customerEmail, product: order.product, amount: order.amount, status: order.status, due_date: order.dueDate, paid_at: order.paidAt }];
};
const updateStatus = (id, userId, status) => Order.updateOne({ _id: id, userId }, { status, paidAt: status === "Paid" ? new Date() : null });
const audit = (orderId, userId, previousStatus, newStatus) => Order.updateOne({ _id: orderId, userId }, { $push: { auditLogs: { previousStatus, newStatus } } });
const dueForReminder = async () => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59, 999);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const orders = await Order.find({ status: { $in: ["Unpaid", "Pending"] }, dueDate: { $lte: tomorrow }, $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lt: today } }] }).populate("userId", "fullName email").lean();
  return orders.map((order) => ({ ...order, id: String(order._id), customer_name: order.customerName, customer_email: order.customerEmail, due_date: order.dueDate, owner_email: order.userId?.email, full_name: order.userId?.fullName }));
};
const recordReminder = (id) => Order.updateOne({ _id: id }, { lastReminderAt: new Date() });
const createReceipt = (orderId, receiptNumber, filePath) => Order.updateOne({ _id: orderId }, { $push: { receipts: { receiptNumber, filePath } } });
const getReceipt = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId }).select("receipts").lean();
  const receipt = order?.receipts?.at(-1);
  return receipt ? [{ receipt_number: receipt.receiptNumber, file_path: receipt.filePath }] : [];
};
module.exports = { listOrders, createOrder, getOrder, updateStatus, audit, dueForReminder, recordReminder, createReceipt, getReceipt };
