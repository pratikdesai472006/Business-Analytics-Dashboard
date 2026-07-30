const connectDatabase = require("../lib/mongodb");
const { processPaymentReminders } = require("../services/reminderService");

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    const result = await processPaymentReminders();
    return res.status(200).json({
      success: true,
      message: "Daily payment reminders cron executed successfully",
      processedCount: result.processedCount,
    });
  } catch (error) {
    console.error("Cron Reminder Error:", error);
    return res.status(500).json({ message: error.message || "Cron Server Error" });
  }
};
