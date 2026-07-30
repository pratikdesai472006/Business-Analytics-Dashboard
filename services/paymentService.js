const Order = require("../models/Order");

const listOrders = async (userId) => {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((order) => ({
    id: String(order._id),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    product: order.product,
    amount: order.amount,
    status: order.status,
    dueDate: order.dueDate,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  }));
};

const getUserOrders = listOrders;

const createOrder = async (userId, items, totalAmount, customerInfo) => {
  const order = await Order.create({
    userId,
    customerName: customerInfo?.name || customerInfo?.customerName || "Customer",
    customerEmail: customerInfo?.email || customerInfo?.customerEmail || "",
    product: Array.isArray(items) && items[0]?.name ? items[0].name : (typeof items === "string" ? items : "Standard Service"),
    amount: totalAmount || 0,
    dueDate: new Date(Date.now() + 7 * 86400000),
    status: "Unpaid",
  });
  return { id: String(order._id), ...order.toObject() };
};

const getOrder = async (id, userId) => {
  const order = await Order.findOne({ _id: id, userId }).lean();
  if (!order) return [];
  return [{ id: String(order._id), customer_name: order.customerName, customer_email: order.customerEmail, product: order.product, amount: order.amount, status: order.status, due_date: order.dueDate, paid_at: order.paidAt }];
};

const updateStatus = (id, userId, status) => Order.updateOne({ _id: id, userId }, { status, paidAt: status === "Paid" ? new Date() : null });

const updateOrderStatus = async (userId, orderId, status) => {
  await Order.updateOne({ _id: orderId, userId }, { status, paidAt: status === "Paid" ? new Date() : null });
  const updated = await Order.findOne({ _id: orderId, userId }).lean();
  return updated ? { id: String(updated._id), ...updated } : null;
};

const generateReceiptPdf = async (userId, orderId) => {
  const PDFDocument = require("pdfkit");
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(20).text("Receipt", { align: "center" });
    doc.moveDown();
    if (order) {
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Customer: ${order.customerName}`);
      doc.text(`Product: ${order.product}`);
      doc.text(`Amount: ₹${order.amount}`);
      doc.text(`Status: ${order.status}`);
    } else {
      doc.fontSize(12).text("Order details not found");
    }
    doc.end();
  });
};

const audit = (orderId, userId, previousStatus, newStatus) => Order.updateOne({ _id: orderId, userId }, { $push: { auditLogs: { previousStatus, newStatus } } });

const dueForReminder = async () => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59, 999);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const orders = await Order.find({ status: { $in: ["Unpaid", "Pending"] }, dueDate: { $lte: tomorrow }, $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lt: today } }] }).populate("userId", "fullName email").lean();
  return orders.map((order) => ({ ...order, id: String(order._id), customer_name: order.customerName, customer_email: order.customerEmail, due_date: order.dueDate, owner_email: order.userId?.email, full_name: order.userId?.fullName }));
};

const recordReminder = (id) => Order.updateOne({ _id: id }, { lastReminderAt: new Date() });

const createReceipt = (orderId, receiptNumber, data) =>
  Order.updateOne({ _id: orderId }, { $push: { receipts: { receiptNumber, data } } });

const getReceipt = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId }).select("receipts").lean();
  const receipt = order?.receipts?.at(-1);
  return receipt ? [{ receipt_number: receipt.receiptNumber, data: receipt.data }] : [];
};

module.exports = {
  listOrders,
  getUserOrders,
  createOrder,
  getOrder,
  updateStatus,
  updateOrderStatus,
  generateReceiptPdf,
  audit,
  dueForReminder,
  recordReminder,
  createReceipt,
  getReceipt,
};
