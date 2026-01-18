const { loginService, registerService } = require("./auth.service");

async function login(req, res, next) {
  try {
    const token = await loginService(req.body);
    return res.status(200).json({ token });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const token = await registerService(req.body);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, register };
