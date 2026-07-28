const bcrypt = require("bcryptjs");

const {
  findUserByEmail,
  createUser,
} = require("../services/authService");

const generateToken = require("../utils/generateToken");

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await createUser(
      fullName,
      email,
      hashedPassword
    );

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      token: generateToken(result.insertId),
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  register,
};