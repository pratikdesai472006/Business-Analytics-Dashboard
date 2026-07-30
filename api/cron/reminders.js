const connectDatabase = require("../../lib/mongodb");
const { sendDueReminders } = require("../../services/reminderService");

module.exports = async (req, res) => {
  // Optional security check for Vercel Cron header if CRON_SECRET is configured
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized cron request" });
  }

  try {
    await connectDatabase();
    const count = await sendDueReminders();
    return res.status(200).json({
      success: true,
      message: `Sent ${count} payment reminders successfully.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron Reminders Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment reminders.",
    });
  }
};
