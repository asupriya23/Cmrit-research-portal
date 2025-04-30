// Register route
router.post('/register', async (req, res) => {
    const { name, email, password, department, designation, scholarProfileUrl, introduction, profilePictureUrl } = req.body;
  
    try {
      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
  
      // Create user
      const user = new User({ name, email, password });
      await user.save();
  
      // Create profile
      const profile = new Profile({
        user: user._id,
        department,
        designation,
        scholarProfileUrl,
        profilePictureUrl,
        introduction
      });
      await profile.save();
  
      // Issue JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(201).json({ token, userId: user._id, name: user.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });
  