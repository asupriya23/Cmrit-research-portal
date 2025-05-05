// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Use bcryptjs consistently

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address'] // Basic email validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'] // Example validation
  },
  // Link to the user's profile document
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }
}, { timestamps: true });

// Hash password BEFORE saving a new user or when password is modified
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error("Error hashing password:", err);
    next(err); // Pass error to the next middleware/save operation
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
   return bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', userSchema);