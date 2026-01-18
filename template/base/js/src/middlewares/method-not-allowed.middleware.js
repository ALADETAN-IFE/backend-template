const methodNotAllowed = (allowedMethods) => (req, res, next) => {
  if (!allowedMethods.includes(req.method)) {
    res.set("Allow", allowedMethods.join(", "));
    return res.status(405).json({
      status: "error",
      message: `Method ${req.method} not allowed for ${req.originalUrl}`,
      allowed: allowedMethods,
    });
  }
  next();
};

module.exports = methodNotAllowed;
