const bcrypt = require("bcryptjs");
const connectDatabase = require("../lib/mongodb");
const { findUserByEmail, createUser, getUserProfile } = require("../services/authService");
const generateToken = require("../utils/generateToken");
const { verifyToken } = require("../lib/auth");

module.exports = async (req, res) => {
  const url = req.url || "";

  try {
    await connectDatabase();

    // Helper to safely parse JSON body
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    body = body || {};

    // 1. REGISTER: /api/auth/register
    if (url.includes("/register") || req.query?.action === "register") {
      if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

      const { fullName, email, password } = body;
      if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
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
    }

    // 2. LOGIN: /api/auth/login
    if (url.includes("/login") || req.query?.action === "login") {
      if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

      const { email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        token: generateToken(user.id),
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    }

    // 3. GET CURRENT USER: /api/auth/me
    if (url.includes("/me") || req.query?.action === "me") {
      if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ success: false, message: "Access denied. Invalid or missing token." });
      }

      const user = await getUserProfile(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    }

    return res.status(404).json({ message: "Auth endpoint not found" });
  } catch (error) {
    console.error("Auth API Error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
