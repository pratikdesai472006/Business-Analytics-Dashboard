const PDFDocument = require("pdfkit");
const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const service = require("../../../services/paymentService");

const createReceiptPdf = (order, number) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 54 });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

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
      .text(`Amount paid: Rs. ${Number(order.amount).toLocaleString("en-IN")}`)
      .text(`Payment date: ${order.paid_at ? new Date(order.paid_at).toLocaleDateString() : new Date().toLocaleDateString()}`)
      .moveDown()
      .fillColor("#64748b")
      .text("This receipt confirms that payment was received.");

    doc.end();
  });

module.exports = protect(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    await connectDatabase();

    const [order] = await service.getOrder(id, req.user.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Paid") {
      return res.status(400).json({ message: "A receipt can only be issued for paid orders." });
    }

    let [saved] = await service.getReceipt(order.id, req.user.id);
    if (!saved) {
      const number = `RCT-${Date.now()}-${order.id}`;
      const data = await createReceiptPdf(order, number);
      await service.createReceipt(order.id, number, data);
      [saved] = await service.getReceipt(order.id, req.user.id);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${saved.receipt_number}.pdf"`);
    return res.send(saved.data);
  } catch (error) {
    console.error("Receipt Generation Error:", error);
    return res.status(500).json({ message: "Could not generate receipt" });
  }
});
