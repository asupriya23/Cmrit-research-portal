const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty'); // Assuming you have a Faculty model
// Example of fetching data from a MongoDB model, adjust for your DB

// Route to get all faculty members, with optional filters
router.get('/faculty', async (req, res) => {
  try {
    const { searchTerm, department, sortBy } = req.query;

    // Building the query for the database
    let filter = {};
    if (department && department !== 'All Departments') {
      filter.department = department;
    }
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { researchAreas: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Sorting logic
    const sort = {};
    if (sortBy === 'name') {
      sort.name = 1; // Ascending
    } else if (sortBy === 'publications') {
      sort.publications = -1; // Descending
    } else if (sortBy === 'citations') {
      sort.citations = -1; // Descending
    } else if (sortBy === 'hIndex') {
      sort.hIndex = -1; // Descending
    }

    const facultyMembers = await Faculty.find(filter).sort(sort);
    res.status(200).json(facultyMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
