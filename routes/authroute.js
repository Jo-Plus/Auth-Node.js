const { Router } = require("express");
const {
  registerUserCtrl,
  loginUserCtrl,
  verifyUserAccountCtrl,
} = require("../controllers/auth-controller.js");
const { default: rateLimit } = require("express-rate-limit");
const router = Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 10 minutes.",
});

router.post("/register", registerUserCtrl);
router.post("/login", loginLimiter, loginUserCtrl);
router.get("/verify/:token", verifyUserAccountCtrl);

module.exports = router;
