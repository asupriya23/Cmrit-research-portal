// models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  // Link back to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user should have only one profile
  },
  name: { // Store name here as well for easier querying of profiles
    type: String,
    required: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  designation: {
    type: String,
    required: [true, 'Designation is required']
  },
  googleScholarUrl: { // Renamed from scholarProfileUrl for consistency
    type: String,
    required: [true, 'Google Scholar URL is required'],
    // Add validation for URL format if needed
  },
  profilePictureUrl: {
    type: String,
    default: 'https://placehold.co/100x100/cccccc/ffffff?text=No+Image' // Default placeholder
  },
  introduction: {
    type: String,
    required: [true, 'Introduction is required']
  },
  // Store scraped metrics directly
  citations: {
    type: Number, // Store as number for sorting/filtering
    default: 0
  },
  hIndex: {
    type: Number, // Store as number
    default: 0
  },
  i10Index: {
    type: Number, // Store as number
    default: 0
  },
  // Store scraped publications
  publications: [
    {
      _id: false, // Don't need individual IDs for subdocuments here
      title: String,
      authors: String, // Added authors field from scraper
      venue: String,   // Added venue field from scraper
      year: String     // Keep year as string if inconsistent format, otherwise Number
    }
  ],
  // Store research areas if scraped or entered
  researchAreas: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastScrapedAt: { // Track when the profile was last updated from Scholar
      type: Date
  }
});

// Optional: Index fields for faster searching/sorting
profileSchema.index({ name: 'text', researchAreas: 'text' }); // For text search
profileSchema.index({ department: 1 });
profileSchema.index({ citations: -1 });
profileSchema.index({ hIndex: -1 });


module.exports = mongoose.model('Profile', profileSchema);
