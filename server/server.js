const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cron = require("node-cron");
const { sendDueReminders } = require("./services/reminderService");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", paymentRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running successfully!",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

cron.schedule("0 9 * * *", () => sendDueReminders().catch((error) => console.error("Payment reminder failed", error)));
