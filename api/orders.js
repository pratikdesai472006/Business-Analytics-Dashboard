const connectDatabase = require("../lib/mongodb");
const { verifyToken } = require("../lib/auth");
const {
  getUserOrders,
  createOrder,
  updateOrderStatus,
  generateReceiptPdf,
} = require("../services/paymentService");

function parseRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Access denied. Invalid or missing token." });
  }

  const userId = decoded.id;
  const url = req.url || "";
  const method = req.method;

  try {
    await connectDatabase();

    const matches = url.match(/\/api\/orders\/([a-f0-9]{24})(.*)/i);

    if (matches) {
      const orderId = matches[1];
      const subpath = matches[2] || "";

      // 1. UPDATE ORDER STATUS: /api/orders/:id/status
      if (subpath.includes("/status")) {
        if (method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });
        const body = await parseRawBody(req);
        const { status, paymentMethod } = body;
        const order = await updateOrderStatus(userId, orderId, status, paymentMethod);
        return res.status(200).json({ success: true, order });
      }

      // 2. GENERATE RECEIPT PDF: /api/orders/:id/receipt
      if (subpath.includes("/receipt")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const pdfBuffer = await generateReceiptPdf(userId, orderId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="receipt_${orderId}.pdf"`);
        return res.status(200).send(pdfBuffer);
      }
    }

    // 3. CREATE ORDER: POST /api/orders
    if (method === "POST") {
      const body = await parseRawBody(req);
      const { items, totalAmount, customerInfo } = body;
      const order = await createOrder(userId, items, totalAmount, customerInfo);
      return res.status(201).json({ success: true, order });
    }

    // 4. GET USER ORDERS: GET /api/orders
    if (method === "GET") {
      const orders = await getUserOrders(userId);
      return res.status(200).json({ orders });
    }

    return res.status(404).json({ message: "Order endpoint not found" });
  } catch (error) {
    console.error("Orders API Error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
