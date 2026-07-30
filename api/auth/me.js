const connectDatabase = require("../../lib/mongodb");
const { protect } = require("../../lib/auth");
const { findUserById } = require("../../services/authService");

module.exports = protect(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("GetCurrentUser Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
