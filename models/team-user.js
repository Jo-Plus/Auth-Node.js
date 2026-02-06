const Joi = require("joi");
const mongoose = require("mongoose");

// Team User Schema
const teamUserSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    role: {
      type: String,
      enum: ["leader", "member"],
      required: true,
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
    left_at: {
      type: Date,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    notifications_enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index
teamUserSchema.index({ user_id: 1, team_id: 1 }, { unique: true });

// Add Member Validation
function validateAddMember(obj) {
  const schema = Joi.object({
    user_id: Joi.string().required(),
  });
  return schema.validate(obj);
}

// Update Member Role Validation
function validateUpdateMemberRole(obj) {
  const schema = Joi.object({
    role: Joi.string().valid("leader", "member").required(),
  });
  return schema.validate(obj);
}

const TeamUser = mongoose.model("TeamUser", teamUserSchema);

module.exports = {
  TeamUser,
  validateAddMember,
  validateUpdateMemberRole,
};