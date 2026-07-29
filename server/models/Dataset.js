const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    source: { type: String, enum: ["csv", "manual"], required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId },
    fileSize: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    headers: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Dataset", datasetSchema);
