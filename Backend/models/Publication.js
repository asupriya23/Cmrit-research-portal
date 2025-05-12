// models/Publication.js
const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  // _id is automatically added by Mongoose as ObjectId

  prof_name: { // Name of the professor from the scraped profile
    type: String,
    required: true
  },
  user_id: { // Changed from prof_id to user_id
    // This field will store the numeric ID (e.g., numericProfId from your route)
    // that links the publication to a specific faculty member/user.
    type: Number,
    required: true,
    index: true // Indexing this field will make querying by user_id faster
  },
  paper_title: {
    type: String,
    required: true
  },
  paper_year: {
    type: Number,
    required: false // Year might not always be available
  },
  paper_authors: {
    type: [String],
    required: false // Year might not always be available
  },
  paper_journal: {
    type: String,
    required: false // Year might not always be available
  },
  paper_citations: {
    type: Number,
    required: false // Year might not always be available
  },
  // citationCount: {
  //   type: Number,
  //   required: false // Year might not always be available
  // },
  // hIndex: {
  //   type: Number,
  //   required: false // Year might not always be available
  // },
  // i10Index: {
  //   type: Number,
  //   required: false // Year might not always be available
  // },
  // Add any other fields that your scraper extracts and you want to store
  // e.g., authors, venue/journal, publication URL, citations
  // paper_authors: [String],
  // paper_venue: String,
});

// Create the model from the schema
const Publication = mongoose.model('Publication', publicationSchema, 'publications'); // Explicitly naming collection 'publications'

module.exports = Publication;