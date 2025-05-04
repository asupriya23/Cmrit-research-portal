const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const User = require('./models/User');
const Profile = require('./models/Profile'); // Ensure this model exists
const authenticate = require('./middleware/auth');

const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Register Route
app.post('/register', async (req, res) => {
  console.log(req);
  console.log(Object.keys(req));
  console.log(Object.keys(req.body));
  console.log("3ewdcewcdsx", req.body);

  const { name, email, password, googleScholarUrl } = req.body;
  console.log(name, email, password, googleScholarUrl);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new User({ name, email, password: hashedPassword, googleScholarUrl });
    await newUser.save();

    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    console.error("Register Error:", error); 
    res.status(400).json({ error: 'Error registering user' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Create Profile Route (Protected)
app.post('/create-profile', authenticate, async (req, res) => {
  const { department, designation, scholarProfileUrl, profilePictureUrl, introduction } = req.body;

  try {
    // Get the authenticated user's id
    const userId = req.user.id;

    // Scrape data from Google Scholar
    const scholarData = await scrapeGoogleScholar(scholarProfileUrl);

    // Create a new profile associated with the user
    const newProfile = new Profile({
      user: userId,  // Link profile with the authenticated user
      department,
      designation,
      scholarProfileUrl,
      profilePictureUrl,
      introduction,
      citations: scholarData.citationCount || 0,
      hIndex: scholarData.hIndex || 0,
      i10Index: scholarData.i10Index || 0,
      publications: scholarData.publications || [],
      createdAt: new Date().toISOString(),
    });

    await newProfile.save();
    res.status(201).json({ message: 'Profile created successfully', id: newProfile._id });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Error creating profile' });
  }
});

// Scrape Scholar Route (Protected)
app.post('/scrape', authenticate, async (req, res) => {
  const { googleScholarUrl } = req.body;

  try {
    const data = await scrapeGoogleScholar(googleScholarUrl);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape data' });
  }
});

// Faculty List Route with Filtering/Sorting
app.get('/api/faculty', async (req, res) => {
  try {
    const { searchTerm, department, sortBy } = req.query;

    let filter = {};
    if (department && department !== 'All Departments') filter.department = department;
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { researchAreas: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const sort = {};
    if (sortBy === 'name') sort.name = 1;
    else if (sortBy === 'publications') sort.publications = -1;
    else if (sortBy === 'citations') sort.citations = -1;
    else if (sortBy === 'hIndex') sort.hIndex = -1;

    const facultyMembers = await Faculty.find(filter).sort(sort);
    res.status(200).json(facultyMembers);
  } catch (error) {
    console.error('Error fetching faculty data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Google Scholar Scraping Function
async function scrapeGoogleScholar(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const getText = selector => document.querySelector(selector)?.textContent || '';

    const citationCount = parseInt(document.querySelectorAll('.gsc_rsb_std')[0]?.textContent || '0');
    const hIndex = parseInt(document.querySelectorAll('.gsc_rsb_std')[2]?.textContent || '0');
    const i10Index = parseInt(document.querySelectorAll('.gsc_rsb_std')[4]?.textContent || '0');

    const publications = Array.from(document.querySelectorAll('.gsc_a_t'))
      .map(pub => pub.textContent.trim());

    return {
      citationCount,
      hIndex,
      i10Index,
      publications,
    };
  });

  await browser.close();
  return data;
}

// Start the Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
