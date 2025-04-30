const express = require('express');
const { createProfile, getProfile } = require('../controllers/profileController');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

// Create profile (Protected)
router.post('/', authenticate, async (req, res) => {
  const { department, designation, scholarProfileUrl, profilePictureUrl, introduction } = req.body;
  const userId = req.user.id; // Get user ID from JWT payload

  try {
    const newProfile = await createProfile({ 
      userId, 
      department, 
      designation, 
      scholarProfileUrl, 
      profilePictureUrl, 
      introduction 
    });

    res.status(201).json(newProfile);
  } catch (error) {
    res.status(500).json({ error: 'Error creating profile' });
  }
});

// Get profile by ID
router.get('/:id', getProfile);

module.exports = router;
