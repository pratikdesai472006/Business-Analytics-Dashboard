const mongoose = require("mongoose");
require("dotenv").config();

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully");
};

module.exports = connectDatabase;
