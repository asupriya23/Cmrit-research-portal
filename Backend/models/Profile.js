const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  scholarProfileUrl: { type: String, required: true },
  profilePictureUrl: { type: String },
  introduction: { type: String, required: true },
  citations: { type: String, default: '0' },
  hIndex: { type: String, default: '0' },
  i10Index: { type: String, default: '0' },
  publications: [
    {
      title: String,
      year: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', profileSchema);
