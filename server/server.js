const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const connectDatabase = require("./config/db");
const { sendDueReminders } = require("./services/reminderService");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", paymentRoutes);
app.get("/", (req, res) => res.json({ success: true, message: "Backend is running successfully!" }));

cron.schedule("0 9 * * *", () =>
  sendDueReminders().catch((error) => console.error("Payment reminder failed", error)),
);

const startServer = async () => {
  try {
    await connectDatabase();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
};

startServer();
