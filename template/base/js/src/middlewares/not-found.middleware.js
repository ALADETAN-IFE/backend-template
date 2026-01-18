const notFound = (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  notFound,
};
