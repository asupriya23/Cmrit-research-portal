// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: {
    // Numeric, auto-incremented user ID
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    // Assuming you have this from previous context
    type: String,
    required: true,
  },
  googleScholarUrl: {
    // URL for this user's Google Scholar profile
    type: String,
    default: null,
  },
  lastScrapedAt: {
    // To keep track of the last scrape time
    type: Date,
    default: null,
  },
  // ... other fields like department, designation, createdAt, updatedAt
  department: String,
  designation: String,
  introduction: String,
  profilePicture: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  citationCount: Number,
  hIndex: Number,
  i10Index: Number,
  citationHistory: [
    {
      year: Number,
      citations: Number,
    },
  ],
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
