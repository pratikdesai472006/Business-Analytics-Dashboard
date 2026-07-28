const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const service = require("../services/paymentService");
const receiptDir = path.join(__dirname, "..", "receipts");
if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

const listOrders = async (req, res) => {
  try {
    res.json({ success: true, orders: await service.listOrders(req.user.id) });
  } catch {
    res.status(500).json({ message: "Could not load orders" });
  }
};
const createOrder = async (req, res) => {
  const { customerName, customerEmail, product, amount, dueDate } = req.body;
  if (!customerName || !product || !amount || !dueDate)
    return res.status(400).json({
      message: "Customer, product, amount, and due date are required.",
    });
  try {
    const result = await service.createOrder({
      userId: req.user.id,
      customerName,
      customerEmail,
      product,
      amount,
      dueDate,
    });
    res.status(201).json({ success: true, id: result.insertId });
  } catch {
    res.status(500).json({ message: "Could not create order" });
  }
};
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!["Unpaid", "Pending", "Paid"].includes(status))
    return res.status(400).json({ message: "Invalid payment status" });
  try {
    const [order] = await service.getOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await service.updateStatus(order.id, req.user.id, status);
    await service.audit(order.id, req.user.id, order.status, status);
    res.json({ success: true, message: "Payment status updated" });
  } catch {
    res.status(500).json({ message: "Could not update payment status" });
  }
};
const receipt = async (req, res) => {
  try {
    const [order] = await service.getOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "Paid")
      return res
        .status(400)
        .json({ message: "A receipt can only be issued for paid orders." });
    let [saved] = await service.getReceipt(order.id, req.user.id);
    if (!saved) {
      const number = `RCT-${Date.now()}-${order.id}`;
      const fileName = `${number}.pdf`;
      const filePath = path.join(receiptDir, fileName);
      const doc = new PDFDocument({ margin: 54 });
      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(22).fillColor("#2563eb").text("Payment receipt");
      doc
        .moveDown()
        .fillColor("#111827")
        .fontSize(11)
        .text(`Receipt number: ${number}`)
        .text(`Issued: ${new Date().toLocaleDateString()}`)
        .moveDown()
        .text(`Received from: ${order.customer_name}`)
        .text(`Order: ${order.product}`)
        .text(`Amount paid: ₹${Number(order.amount).toLocaleString("en-IN")}`)
        .text(`Payment date: ${new Date(order.paid_at).toLocaleDateString()}`)
        .moveDown()
        .fillColor("#64748b")
        .text("This receipt confirms that payment was received.");
      doc.end();
      await new Promise((resolve) => doc.on("end", resolve));
      await service.createReceipt(order.id, number, fileName);
      [saved] = await service.getReceipt(order.id, req.user.id);
    }
    res.download(
      path.join(receiptDir, saved.file_path),
      saved.receipt_number + ".pdf",
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not generate receipt" });
  }
};
module.exports = { listOrders, createOrder, updateOrderStatus, receipt };
