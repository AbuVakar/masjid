const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Jamaat', 'Taqaza', 'Suggestions', 'Facing Issues', 'General'],
      default: 'General',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: {
        validator: function (v) {
          return !v || /^\+?\d{7,15}$/.test(v);
        },
        message: 'Please enter a valid mobile number',
      },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userRole: {
      type: String,
      enum: ['admin', 'user', 'guest'],
      default: 'user',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ category: 1, createdAt: -1 });
contactSchema.index({ submittedBy: 1, createdAt: -1 });

// Virtual for formatted date
contactSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Ensure virtual fields are serialized
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);
