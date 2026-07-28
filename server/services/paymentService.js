const db = require("../config/db");
const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (error, results) =>
      error ? reject(error) : resolve(results),
    ),
  );

const listOrders = (userId) =>
  query(
    "SELECT id, customer_name AS customerName, customer_email AS customerEmail, product, amount, status, due_date AS dueDate, paid_at AS paidAt, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
const createOrder = ({
  userId,
  customerName,
  customerEmail,
  product,
  amount,
  dueDate,
}) =>
  query(
    "INSERT INTO orders (user_id, customer_name, customer_email, product, amount, status, due_date) VALUES (?, ?, ?, ?, ?, 'Unpaid', ?)",
    [userId, customerName, customerEmail || null, product, amount, dueDate],
  );
const getOrder = (id, userId) =>
  query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId]);
const updateStatus = (id, userId, status) =>
  query(
    "UPDATE orders SET status = ?, paid_at = CASE WHEN ? = 'Paid' THEN NOW() ELSE NULL END WHERE id = ? AND user_id = ?",
    [status, status, id, userId],
  );
const audit = (orderId, userId, fromStatus, toStatus) =>
  query(
    "INSERT INTO payment_audit_logs (order_id, user_id, previous_status, new_status) VALUES (?, ?, ?, ?)",
    [orderId, userId, fromStatus, toStatus],
  );
const dueForReminder = () =>
  query(
    "SELECT o.*, u.full_name, u.email AS owner_email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status IN ('Unpaid', 'Pending') AND o.due_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND (o.last_reminder_at IS NULL OR DATE(o.last_reminder_at) < CURDATE())",
  );
const recordReminder = (id) =>
  query("UPDATE orders SET last_reminder_at = NOW() WHERE id = ?", [id]);
const createReceipt = (orderId, receiptNumber, filePath) =>
  query(
    "INSERT INTO payment_receipts (order_id, receipt_number, file_path) VALUES (?, ?, ?)",
    [orderId, receiptNumber, filePath],
  );
const getReceipt = (orderId, userId) =>
  query(
    "SELECT pr.* FROM payment_receipts pr JOIN orders o ON o.id = pr.order_id WHERE pr.order_id = ? AND o.user_id = ? ORDER BY pr.created_at DESC LIMIT 1",
    [orderId, userId],
  );
module.exports = {
  listOrders,
  createOrder,
  getOrder,
  updateStatus,
  audit,
  dueForReminder,
  recordReminder,
  createReceipt,
  getReceipt,
};
