module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy (Vercel Serverless)",
    timestamp: new Date().toISOString(),
  });
};
