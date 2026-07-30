const jwt = require('jsonwebtoken');

const getAuthToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const verifyToken = (req) => {
  const token = getAuthToken(req);
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "SalesDashboardSecret123";
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const protect = (handler) => {
  return async (req, res) => {
    const decoded = verifyToken(req);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or missing token.',
      });
    }

    req.user = decoded;
    return handler(req, res);
  };
};

module.exports = {
  verifyToken,
  protect,
};
