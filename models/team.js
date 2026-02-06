const Joi = require("joi");
const mongoose = require("mongoose");

// Team Schema
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    teamPhoto: {
      type: Object,
      default: {
        url: "https://cdn.pixabay.com/photo/2017/11/10/05/48/user-2935527_640.png",
        publicId: null,
      },
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
      onlyLeaderCanSendMessages: {
        type: Boolean,
        default: false,
      },
      onlyLeaderCanChangeInfo: {
        type: Boolean,
        default: true,
      },
      membersCanAddOthers: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Team Create Validation
function validateCreateTeam(obj) {
  const schema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500),
  });
  return schema.validate(obj);
}

// Team Update Validation
function validateUpdateTeam(obj) {
  const schema = Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500),
    settings: Joi.object({
      onlyLeaderCanSendMessages: Joi.boolean(),
      onlyLeaderCanChangeInfo: Joi.boolean(),
      membersCanAddOthers: Joi.boolean(),
    }),
  });
  return schema.validate(obj);
}

const Team = mongoose.model("Team", teamSchema);

module.exports = {
  Team,
  validateCreateTeam,
  validateUpdateTeam,
};