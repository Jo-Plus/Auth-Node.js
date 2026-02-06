const asyncHandler = require("express-async-handler");
const { Team, validateCreateTeam, validateUpdateTeam } = require("../models/team.js");
const { TeamUser, validateAddMember, validateUpdateMemberRole } = require("../models/team-user.js");
const { User } = require("../models/user.js");
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require("../utils/cloudnary.js");
const path = require("node:path");
const fs = require("node:fs");

/**-----------------------------------------------
 * @desc    Create New Team (Group)
 * @route   POST /api/teams
 * @access  Private (Any logged user)
 -----------------------------------------------*/
module.exports.createTeamCtrl = asyncHandler(async (req, res) => {
  const { error } = validateCreateTeam(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const team = await Team.create({
    name: req.body.name,
    description: req.body.description,
    created_by: req.user.id,
  });

  await TeamUser.create({
    user_id: req.user.id,
    team_id: team._id,
    role: "leader",
    joined_at: new Date(),
  });

  res.status(201).json({
    message: "team created successfully",
    team,
  });
});

/**-----------------------------------------------
 * @desc    Get All User Teams
 * @route   GET /api/teams/my-teams
 * @access  Private
 -----------------------------------------------*/
module.exports.getUserTeamsCtrl = asyncHandler(async (req, res) => {
  const teamUsers = await TeamUser.find({
    user_id: req.user.id,
    is_active: true,
  }).populate("team_id");

  const teams = teamUsers.map((tu) => ({
    ...tu.team_id._doc,
    my_role: tu.role,
    joined_at: tu.joined_at,
    notifications_enabled: tu.notifications_enabled,
  }));

  res.status(200).json(teams);
});

/**-----------------------------------------------
 * @desc    Get Team Details
 * @route   GET /api/teams/:id
 * @access  Private (Team members only)
 -----------------------------------------------*/
module.exports.getTeamDetailsCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id).populate("created_by", "-password");
  if (!team) return res.status(404).json({ message: "team not found" });

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  const members = await TeamUser.find({
    team_id: req.params.id,
    is_active: true,
  }).populate("user_id", "-password");

  res.status(200).json({
    team,
    my_role: membership.role,
    members: members.map((m) => ({
      user: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
    })),
  });
});

/**-----------------------------------------------
 * @desc    Update Team Info
 * @route   PUT /api/teams/:id
 * @access  Private (Leader only by default)
 -----------------------------------------------*/
module.exports.updateTeamCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateTeam(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

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

  if (team.settings.onlyLeaderCanChangeInfo && membership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can update team info" });
  }

  const updatedTeam = await Team.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: req.body.name,
        description: req.body.description,
        settings: req.body.settings,
      },
    },
    { new: true }
  );

  res.status(200).json({
    message: "team updated successfully",
    team: updatedTeam,
  });
});

/**-----------------------------------------------
 * @desc    Upload Team Photo
 * @route   POST /api/teams/:id/photo
 * @access  Private (Leader only by default)
 -----------------------------------------------*/
module.exports.teamPhotoUploadCtrl = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "no file provided" });

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

  if (team.settings.onlyLeaderCanChangeInfo && membership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can change team photo" });
  }

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  
  try {
    const result = await cloudinaryUploadImage(imagePath);

    if (team.teamPhoto.publicId !== null) {
      await cloudinaryRemoveImage(team.teamPhoto.publicId);
    }

    team.teamPhoto = { url: result.secure_url, publicId: result.public_id };
    await team.save();

    res.status(200).json({
      message: "team photo uploaded successfully",
      teamPhoto: team.teamPhoto,
    });
  } finally {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
});

/**-----------------------------------------------
 * @desc    Add Member to Team (DEPRECATED - Use Invitations Instead)
 * @route   POST /api/teams/:id/members
 * @access  Private (Leader or if settings allow)
 * @note    This endpoint is deprecated. Use POST /api/teams/:id/invitations instead
 -----------------------------------------------*/
module.exports.addMemberCtrl = asyncHandler(async (req, res) => {
  return res.status(410).json({ 
    message: "This endpoint is deprecated. Please use the invitation system instead.",
    alternative: "POST /api/teams/:id/invitations to send an invitation"
  });
});

/**-----------------------------------------------
 * @desc    Remove Member from Team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private (Leader only)
 -----------------------------------------------*/
module.exports.removeMemberCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const removerMembership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!removerMembership || removerMembership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can remove members" });
  }

  const memberToRemove = await TeamUser.findOne({
    user_id: req.params.userId,
    team_id: req.params.id,
    is_active: true,
  });

  if (!memberToRemove) {
    return res.status(404).json({ message: "member not found in team" });
  }

  if (memberToRemove.role === "leader") {
    return res.status(400).json({ message: "cannot remove team leader" });
  }

  memberToRemove.is_active = false;
  memberToRemove.left_at = new Date();
  await memberToRemove.save();

  res.status(200).json({ message: "member removed successfully" });
});

/**-----------------------------------------------
 * @desc    Leave Team
 * @route   POST /api/teams/:id/leave
 * @access  Private (Any member except last leader)
 -----------------------------------------------*/
module.exports.leaveTeamCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(404).json({ message: "you are not a member of this team" });
  }

  if (membership.role === "leader") {
    const otherLeaders = await TeamUser.countDocuments({
      team_id: req.params.id,
      is_active: true,
      role: "leader",
      _id: { $ne: membership._id },
    });

    if (otherLeaders === 0) {
      return res.status(400).json({
        message: "you are the only leader. assign another leader before leaving",
      });
    }
  }

  membership.is_active = false;
  membership.left_at = new Date();
  await membership.save();

  res.status(200).json({ message: "you left the team successfully" });
});

/**-----------------------------------------------
 * @desc    Update Member Role
 * @route   PUT /api/teams/:id/members/:userId/role
 * @access  Private (Leader only)
 -----------------------------------------------*/
module.exports.updateMemberRoleCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateMemberRole(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const updaterMembership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!updaterMembership || updaterMembership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can change member roles" });
  }

  const memberToUpdate = await TeamUser.findOne({
    user_id: req.params.userId,
    team_id: req.params.id,
    is_active: true,
  });

  if (!memberToUpdate) {
    return res.status(404).json({ message: "member not found in team" });
  }

  memberToUpdate.role = req.body.role;
  await memberToUpdate.save();

  res.status(200).json({
    message: "member role updated successfully",
    member: await memberToUpdate.populate("user_id", "-password"),
  });
});

/**-----------------------------------------------
 * @desc    Delete Team
 * @route   DELETE /api/teams/:id
 * @access  Private (Leader only)
 -----------------------------------------------*/
module.exports.deleteTeamCtrl = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "team not found" });

  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership || membership.role !== "leader") {
    return res.status(403).json({ message: "only leaders can delete the team" });
  }

  if (team.teamPhoto.publicId !== null) {
    await cloudinaryRemoveImage(team.teamPhoto.publicId);
  }

  await TeamUser.deleteMany({ team_id: req.params.id });

  await Team.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "team deleted successfully" });
});

/**-----------------------------------------------
 * @desc    Get Team Members
 * @route   GET /api/teams/:id/members
 * @access  Private (Team members only)
 -----------------------------------------------*/
module.exports.getTeamMembersCtrl = asyncHandler(async (req, res) => {
  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  const members = await TeamUser.find({
    team_id: req.params.id,
    is_active: true,
  })
    .populate("user_id", "-password")
    .sort({ role: -1, joined_at: 1 }); // Leaders first

  res.status(200).json(
    members.map((m) => ({
      user: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      notifications_enabled: m.notifications_enabled,
    }))
  );
});

/**-----------------------------------------------
 * @desc    Toggle Notifications
 * @route   PUT /api/teams/:id/notifications
 * @access  Private (Team members only)
 -----------------------------------------------*/
module.exports.toggleNotificationsCtrl = asyncHandler(async (req, res) => {
  const membership = await TeamUser.findOne({
    user_id: req.user.id,
    team_id: req.params.id,
    is_active: true,
  });

  if (!membership) {
    return res.status(403).json({ message: "you are not a member of this team" });
  }

  membership.notifications_enabled = !membership.notifications_enabled;
  await membership.save();

  res.status(200).json({
    message: "notifications updated successfully",
    notifications_enabled: membership.notifications_enabled,
  });
});