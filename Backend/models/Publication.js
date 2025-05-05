// models/Publication.js
const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  // _id is automatically added by Mongoose as ObjectId

  prof_name: {
    type: String,
    required: true
  },
  prof_id: {
    // Based on your sample (e.g., 1), this appears to be a Number.
    // This is the field that links the publication to a specific professor.
    type: Number,
    required: true,
    index: true // Indexing this field will make querying by prof_id faster
  },
  paper_title: {
    type: String,
    required: true
  },
  paper_year: {
    // Based on your sample ("2009"), this appears to be stored as a String.
    // If you need to perform year-based sorting or range queries,
    // considering changing this to a Number or Date type might be beneficial
    // for future database operations, but keep it String to match your current data.
    type: String,
    required: false // Year might not always be available? Adjust as needed
  },
  // Add any other fields that exist in your publication documents
  // e.g., authors, journal, volume, issue, pages, citations, abstract, etc.
  // example:
  // citations: {
  //   type: Number,
  //   default: 0
  // },
  // journal: {
  //   type: String
  // }
});

// Create the model from the schema
const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;