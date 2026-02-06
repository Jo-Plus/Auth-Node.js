const router = require('express').Router();
const { 
    resetPasswordCtrl, 
    getResetPasswordLinkCtrl, 
    sendResetPasswordLinkCtrl 
} = require('../controllers/password-controller.js');

// /api/password/reset-password-link
router.post('/reset-password-link', sendResetPasswordLinkCtrl);

// /api/password/reset-password/:userId/:token
router.route("/reset-password/:userId/:token")
    .get(getResetPasswordLinkCtrl)
    .post(resetPasswordCtrl);

module.exports = router;