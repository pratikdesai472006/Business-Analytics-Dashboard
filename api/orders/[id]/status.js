const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const service = require("../../../services/paymentService");

module.exports = protect(async (req, res) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    await connectDatabase();

    const { status } = req.body || {};
    if (!["Unpaid", "Pending", "Paid"].includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const [order] = await service.getOrder(id, req.user.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await service.updateStatus(order.id, req.user.id, status);
    await service.audit(order.id, req.user.id, order.status, status);

    return res.json({ success: true, message: "Payment status updated" });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ message: "Could not update payment status" });
  }
});
