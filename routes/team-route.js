const router = require("express").Router();
const {
  createTeamCtrl,
  getUserTeamsCtrl,
  getTeamDetailsCtrl,
  updateTeamCtrl,
  teamPhotoUploadCtrl,
  addMemberCtrl,
  removeMemberCtrl,
  leaveTeamCtrl,
  updateMemberRoleCtrl,
  deleteTeamCtrl,
  getTeamMembersCtrl,
  toggleNotificationsCtrl,
} = require("../controllers/team-controller.js");
const {
  sendInvitationCtrl,
  getTeamInvitationsCtrl,
  getInvitationStatsCtrl,
} = require("../controllers/invitation-controller.js");
const { verifyToken } = require("../middleware/verify-token.js");
const photoUpload = require("../middleware/photo-upload.js");

// /api/teams

// Create team & Get user's teams
router
  .route("/")
  .post(verifyToken, createTeamCtrl);

router.route("/my-teams").get(verifyToken, getUserTeamsCtrl);

// Team operations
router
  .route("/:id")
  .get(verifyToken, getTeamDetailsCtrl)
  .put(verifyToken, updateTeamCtrl)
  .delete(verifyToken, deleteTeamCtrl);

// Team photo
router
  .route("/:id/photo")
  .post(verifyToken, photoUpload.single("image"), teamPhotoUploadCtrl);

// Invitations (NEW - replaces direct add member)
router
  .route("/:id/invitations")
  .get(verifyToken, getTeamInvitationsCtrl)
  .post(verifyToken, sendInvitationCtrl);

router
  .route("/:id/invitations/stats")
  .get(verifyToken, getInvitationStatsCtrl);

// Members management
router
  .route("/:id/members")
  .get(verifyToken, getTeamMembersCtrl)
  .post(verifyToken, addMemberCtrl);

router
  .route("/:id/members/:userId")
  .delete(verifyToken, removeMemberCtrl);

router
  .route("/:id/members/:userId/role")
  .put(verifyToken, updateMemberRoleCtrl);

// Leave team
router.route("/:id/leave").post(verifyToken, leaveTeamCtrl);

// Notifications toggle
router.route("/:id/notifications").put(verifyToken, toggleNotificationsCtrl);

module.exports = router;