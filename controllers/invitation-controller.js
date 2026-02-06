const asyncHandler = require("express-async-handler");
const { Team } = require("../models/team.js");
const { TeamUser } = require("../models/team-user.js");
const { TeamInvitation, validateSendInvitation } = require("../models/team-invitation.js");
const { User } = require("../models/user.js");

/**-----------------------------------------------
 * @desc    Send Invitation to User
 * @route   POST /api/teams/:id/invitations
 * @access  Private (Leader or if settings allow)
 -----------------------------------------------*/
module.exports.sendInvitationCtrl = asyncHandler(async (req, res) => {
  const { error } = validateSendInvitation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const senderMembership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!senderMembership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  if (!team.settings.membersCanAddOthers && senderMembership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can send invitations" });
  }

  const userToInvite = await User.findById(req.body.user_id);
  if (!userToInvite) return res.status(404).json({ message: "user not found" });

  const existingMember = await TeamUser.findOne({
    user_id: req.body.user_id,
    team_id: req.params.id,
    is_active: true,
  });

  if (existingMember) {
    return res.status(400).json({ message: "user is already a member" });
  }

  const existingInvitation = await TeamInvitation.findOne({
    team_id: req.params.id,
    invited_user_id: req.body.user_id,
    status: "pending",
  });

  if (existingInvitation) {
    return res.status(400).json({ message: "invitation already sent to this user" });
  }

  const invitation = await TeamInvitation.create({
    team_id: req.params.id,
    invited_user_id: req.body.user_id,
    invited_by: req.user.id,
    message: req.body.message,
  });

  const populatedInvitation = await TeamInvitation.findById(invitation._id)
    .populate("team_id", "name description teamPhoto")
    .populate("invited_user_id", "username email profilePhoto")
    .populate("invited_by", "username email profilePhoto");

  res.status(201).json({
    message: "invitation sent successfully",
    invitation: populatedInvitation,
  });
});

/**-----------------------------------------------
 * @desc    Get My Pending Invitations
 * @route   GET /api/teams/invitations/pending
 * @access  Private
 -----------------------------------------------*/
module.exports.getMyInvitationsCtrl = asyncHandler(async (req, res) => {
  const invitations = await TeamInvitation.find({
    invited_user_id: req.user.id,
    status: "pending",
  })
    .populate("team_id", "name description teamPhoto")
    .populate("invited_by", "username email profilePhoto")
    .sort({ invited_at: -1 });

  res.status(200).json(invitations);
});

/**-----------------------------------------------
 * @desc    Get Team Invitations (for leaders)
 * @route   GET /api/teams/:id/invitations
 * @access  Private (Team members only)
 -----------------------------------------------*/
module.exports.getTeamInvitationsCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  const invitations = await TeamInvitation.find({
    team_id: req.params.id,
  })
    .populate("invited_user_id", "username email profilePhoto")
    .populate("invited_by", "username email profilePhoto")
    .sort({ invited_at: -1 });

  res.status(200).json(invitations);
});

/**-----------------------------------------------
 * @desc    Accept Invitation
 * @route   POST /api/teams/invitations/:invitationId/accept
 * @access  Private (Invited user only)
 -----------------------------------------------*/
module.exports.acceptInvitationCtrl = asyncHandler(async (req, res) => {
  const invitation = await TeamInvitation.findById(req.params.invitationId);
  
  if (!invitation) {
    return res.status(404).json({ message: "invitation not found" });
  }

  if (invitation.invited_user_id.toString() !== req.user.id) {
    return res.status(403).json({ message: "this invitation is not for you" });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({ 
      message: `invitation already ${invitation.status}` 
    });
  }

  const team = await Team.findById(invitation.team_id);
  if (!team) {
    return res.status(404).json({ message: "team not found" });
  }

  const existingMember = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: invitation.team_id,
    is_active: true,
  });

  if (existingMember) {
    // Update invitation status
    invitation.status = "accepted";
    invitation.responded_at = new Date();
    await invitation.save();
    
    return res.status(400).json({ message: "you are already a member of this team" });
  }

  const newMember = await TeamUser.create({
    user_id: req.user.id,
    team_id: invitation.team_id,
    role: "member",
    joined_at: new Date(),
  });

  invitation.status = "accepted";
  invitation.responded_at = new Date();
  await invitation.save();

  const populatedMember = await TeamUser.findById(newMember._id)
    .populate("user_id", "-password")
    .populate("team_id");

  res.status(200).json({
    message: "invitation accepted successfully",
    membership: populatedMember,
  });
});

/**-----------------------------------------------
 * @desc    Reject Invitation
 * @route   POST /api/teams/invitations/:invitationId/reject
 * @access  Private (Invited user only)
 -----------------------------------------------*/
module.exports.rejectInvitationCtrl = asyncHandler(async (req, res) => {
  const invitation = await TeamInvitation.findById(req.params.invitationId);
  
  if (!invitation) {
    return res.status(404).json({ message: "invitation not found" });
  }

  if (invitation.invited_user_id.toString() !== req.user.id) {
    return res.status(403).json({ message: "this invitation is not for you" });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({ 
      message: `invitation already ${invitation.status}` 
    });
  }

  invitation.status = "rejected";
  invitation.responded_at = new Date();
  await invitation.save();

  res.status(200).json({
    message: "invitation rejected",
    invitation,
  });
});

/**-----------------------------------------------
 * @desc    Cancel Invitation (by sender or leader)
 * @route   DELETE /api/teams/invitations/:invitationId
 * @access  Private (Invitation sender or team leader)
 -----------------------------------------------*/
module.exports.cancelInvitationCtrl = asyncHandler(async (req, res) => {
  const invitation = await TeamInvitation.findById(req.params.invitationId);
  
  if (!invitation) {
    return res.status(404).json({ message: "invitation not found" });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({ 
      message: `cannot cancel ${invitation.status} invitation` 
    });
  }

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: invitation.team_id,
    is_active: true,
  });

  const canCancel = 
    invitation.invited_by.toString() === req.user.id || 
    (membership && membership.role === "leader");

  if (!canCancel) {
    return res.status(403).json({ 
      message: "only invitation sender or team leaders can cancel invitations" 
    });
  }

  await TeamInvitation.findByIdAndDelete(req.params.invitationId);

  res.status(200).json({ message: "invitation cancelled successfully" });
});

/**-----------------------------------------------
 * @desc    Get Invitation Statistics (for team)
 * @route   GET /api/teams/:id/invitations/stats
 * @access  Private (Team members)
 -----------------------------------------------*/
module.exports.getInvitationStatsCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  const stats = await TeamInvitation.aggregate([
    {
      $match: { team_id: team._id }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
  });

  res.status(200).json(formattedStats);
});