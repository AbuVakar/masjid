const mongoose = require('mongoose');

const infoItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false, // Made optional to allow empty contacts
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: [20, 'Mobile cannot exceed 20 characters'],
      // Removed strict validation - simple string field only
    },
    time: {
      type: String,
      trim: true,
      maxlength: [20, 'Time cannot exceed 20 characters'],
    },
  },
  {
    timestamps: true,
  },
);

const infoSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    items: [infoItemSchema],
  },
  {
    timestamps: true,
  },
);

const infoDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Info type is required'],
      enum: [
        'timetable',
        'imam',
        'aumoor',
        'running',
        'outgoing',
        'contact',
        'resources_imp',
        'resources_dawah',
        'resources_gallery',
        'resources_misc',
      ],
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // For simple items (aumoor, contact, etc.)
    items: [infoItemSchema],
    // For complex sections (jamaat activities, etc.)
    sections: [infoSectionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
infoDataSchema.index({ type: 1, isActive: 1 });
infoDataSchema.index({ updatedBy: 1, createdAt: -1 });

// Virtual for formatted update time
infoDataSchema.virtual('formattedUpdateTime').get(function () {
  return this.updatedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Method to increment version
infoDataSchema.methods.incrementVersion = function () {
  this.version += 1;
  return this.save();
};

// Ensure virtual fields are serialized
infoDataSchema.set('toJSON', { virtuals: true });
infoDataSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InfoData', infoDataSchema);
