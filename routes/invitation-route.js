const router = require("express").Router();
const {
  sendInvitationCtrl,
  getMyInvitationsCtrl,
  getTeamInvitationsCtrl,
  acceptInvitationCtrl,
  rejectInvitationCtrl,
  cancelInvitationCtrl,
  getInvitationStatsCtrl,
} = require("../controllers/invitation-controller.js");
const { verifyToken } = require("../middleware/verify-token.js");

// /api/teams/invitations

// Get my pending invitations
router.route("/pending").get(verifyToken, getMyInvitationsCtrl);

// Accept/Reject specific invitation
router
  .route("/:invitationId/accept")
  .post(verifyToken, acceptInvitationCtrl);

router
  .route("/:invitationId/reject")
  .post(verifyToken, rejectInvitationCtrl);

// Cancel invitation (by sender or leader)
router
  .route("/:invitationId")
  .delete(verifyToken, cancelInvitationCtrl);

module.exports = router;