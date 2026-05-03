const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure owner is always a member with admin role
teamSchema.pre('save', function (next) {
  if (this.isNew) {
    const ownerExists = this.members.some(
      (m) => m.user.toString() === this.owner.toString()
    );
    if (!ownerExists) {
      this.members.push({ user: this.owner, role: 'admin' });
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
