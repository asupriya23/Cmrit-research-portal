const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  image: { type: String, required: true },
  researchAreas: [String],
  publications: { type: Number, default: 0 },
  citations: { type: Number, default: 0 },
  hIndex: { type: Number, default: 0 },
});

const Faculty = mongoose.model('Faculty', facultySchema);
module.exports = Faculty;
