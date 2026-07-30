const bcrypt = require("bcryptjs");
const connectDatabase = require("../../lib/mongodb");
const { findUserByEmail, createUser } = require("../../services/authService");
const generateToken = require("../../utils/generateToken");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const { fullName, email, password } = body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await createUser(fullName, email, hashedPassword);

    return res.status(201).json({
      success: true,
      message: "Registration Successful",
      token: generateToken(result.id),
      user: {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
