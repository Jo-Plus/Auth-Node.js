const router = require("express").Router();
const {
  getUserProfileCtrl,
  updateUserProfileCtrl,
  getUsersCountCtrl,
  profilePhotoUploadCtrl,
  deleteUserProfileCtrl,
} = require("../controllers/user-controller.js");
const { verifyToken, verifyTokenAndOnlyUser } = require("../middleware/verify-token.js");
const { validateObjectId } = require("../middleware/validate-objectid.js");
const photoUpload = require("../middleware/photo-upload.js");

router.get("/count", getUsersCountCtrl);

router.route("/profile/:id")
  .get(validateObjectId, getUserProfileCtrl)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
  .delete(validateObjectId, verifyTokenAndOnlyUser, deleteUserProfileCtrl);

router.post(
  "/profile/profile-photo-upload",
  verifyToken,
  photoUpload.single("image"),
  profilePhotoUploadCtrl
);

module.exports = router;