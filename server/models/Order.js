const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  { receiptNumber: { type: String, required: true }, data: { type: Buffer, required: true } },
  { timestamps: true },
);
const auditSchema = new mongoose.Schema(
  { previousStatus: String, newStatus: String },
  { timestamps: true },
);
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    product: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Unpaid", "Pending", "Paid"], default: "Unpaid" },
    dueDate: { type: Date, required: true },
    paidAt: Date,
    lastReminderAt: Date,
    auditLogs: [auditSchema],
    receipts: [receiptSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
