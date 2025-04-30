const { scrapeScholarProfile } = require('../scrapers/googleScholarScraper');
const Profile = require('../models/Profile'); // Import Profile model
const User = require('../models/User'); // Import User model

const createProfile = async (req, res) => {
  const { userId, department, designation, scholarProfileUrl, profilePictureUrl, introduction } = req.body;
  
  try {
    // Scrape Google Scholar data
    const scholarData = await scrapeScholarProfile(scholarProfileUrl);

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Create a new profile document in MongoDB
    const newProfile = new Profile({
      user: user._id, // Link profile with user
      department,
      designation,
      scholarProfileUrl,
      profilePictureUrl,
      introduction,
      citations: scholarData.citationCount,
      hIndex: scholarData.hIndex,
      i10Index: scholarData.i10Index,
      publications: scholarData.publications
    });

    const savedProfile = await newProfile.save();

    res.status(201).json({ message: 'Profile created successfully', id: savedProfile._id });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Error creating profile' });
  }
};

const getProfile = async (req, res) => {
  const { id } = req.params;
  
  try {
    const profile = await Profile.findById(id).populate('user', 'name email'); // Populate user info

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

module.exports = { createProfile, getProfile };
