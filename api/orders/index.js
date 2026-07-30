const connectDatabase = require("../../lib/mongodb");
const { protect } = require("../../lib/auth");
const service = require("../../services/paymentService");

module.exports = protect(async (req, res) => {
  try {
    await connectDatabase();

    if (req.method === "GET") {
      const orders = await service.listOrders(req.user.id);
      return res.json({ success: true, orders });
    }

    if (req.method === "POST") {
      const { customerName, customerEmail, product, amount, dueDate } = req.body || {};
      if (!customerName || !product || !amount || !dueDate) {
        return res.status(400).json({
          message: "Customer, product, amount, and due date are required.",
        });
      }

      const result = await service.createOrder({
        userId: req.user.id,
        customerName,
        customerEmail,
        product,
        amount,
        dueDate,
      });

      return res.status(201).json({ success: true, id: result.insertId });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("Orders Error:", error);
    return res.status(500).json({ message: "Could not process orders request" });
  }
});
