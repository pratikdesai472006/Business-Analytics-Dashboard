const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const datasetRoutes = require("./routes/datasetRoutes");
const connectDatabase = require("./config/db");
const { sendDueReminders } = require("./services/reminderService");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", paymentRoutes);
app.use("/api/datasets", datasetRoutes);
app.get("/", (req, res) => res.json({ success: true, message: "Backend is running successfully!" }));
app.get("/api/health", (req, res) => res.json({ success: true, message: "API is healthy" }));

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
