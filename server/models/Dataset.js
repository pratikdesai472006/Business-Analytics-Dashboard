const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["csv", "manual"], default: "csv" },
    source: { type: String, enum: ["csv", "manual"], required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId },
    fileSize: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    headers: [{ type: String }],
    status: { type: String, enum: ["Processing", "Processed", "Failed"], default: "Processing" },
    isActive: { type: Boolean, default: false, index: true },
    uploadedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date },
    activatedAt: { type: Date },
  },
  { timestamps: true },
);

datasetSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
datasetSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Dataset", datasetSchema);
