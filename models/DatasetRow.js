const mongoose = require("mongoose");

const datasetRowSchema = new mongoose.Schema(
  {
    datasetId: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rowNumber: { type: Number, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

datasetRowSchema.index({ datasetId: 1, rowNumber: 1 }, { unique: true });

module.exports = mongoose.models.DatasetRow || mongoose.model("DatasetRow", datasetRowSchema);
