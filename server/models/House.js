const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age cannot exceed 120'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required'],
    },
    occupation: {
      type: String,
      trim: true,
      default: 'Other',
    },
    education: {
      type: String,
      enum: ['Below 8th', '10th', '12th', 'Graduate', 'Above Graduate'],
      default: 'Below 8th',
    },
    quran: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no',
    },
    maktab: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no',
    },
    dawat: {
      type: String,
      enum: ['Nil', '3-day', '10-day', '40-day', '4-month'],
      default: 'Nil',
    },
    dawatCounts: {
      '3-day': { type: Number, default: 0 },
      '10-day': { type: Number, default: 0 },
      '40-day': { type: Number, default: 0 },
      '4-month': { type: Number, default: 0 },
    },
    mobile: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Head', 'Member'],
      default: 'Member',
    },
    isChild: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to set isChild based on age
memberSchema.pre('save', function (next) {
  this.isChild = this.age < 14;
  next();
});

const houseSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, 'House number is required'],
      unique: true,
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street name is required'],
      trim: true,
    },
    members: [memberSchema],
    taleem: {
      type: Boolean,
      default: false,
    },
    mashwara: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for total members
houseSchema.virtual('totalMembers').get(function () {
  return this.members.length;
});

// Virtual for adults count
houseSchema.virtual('adultsCount').get(function () {
  return this.members.filter((member) => member.age >= 14).length;
});

// Virtual for children count
houseSchema.virtual('childrenCount').get(function () {
  return this.members.filter((member) => member.age < 14).length;
});

// Index for better query performance
houseSchema.index({ number: 1, street: 1 });
houseSchema.index({ 'members.name': 1 });
houseSchema.index({ 'members.occupation': 1 });
houseSchema.index({ taleem: 1 });
houseSchema.index({ mashwara: 1 });

module.exports = mongoose.model('House', houseSchema);
