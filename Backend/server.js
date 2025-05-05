// server.js
// Import necessary modules
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const dotenv = require("dotenv");
const { MongoClient, MongoNetworkError } = require("mongodb");
const cors = require("cors");

// --- Load Environment Variables ---
dotenv.config();

// --- Environment Variable Validation ---
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

// --- Configuration ---
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_NAME = process.env.DB_NAME || "scholarData";
const PUBLICATIONS_COLLECTION = "publications";
const PROFESSORS_COLLECTION = "professors";
const UPLOADS_DIR = path.join(__dirname, "uploads"); // Directory to store uploads

// --- Import Models ---
const User = require("./models/User");
const Publication = require("./models/Publication");

// --- Import Middleware ---
const authenticate = require("./middleware/auth");

// --- Import Scrapers ---
const { scrapeScholarProfile } = require("./scrapers/googleScholarScraper");

// --- Initialize Express App ---
const app = express();

// --- Middleware Setup ---
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR)); // Serve uploaded files

// --- MongoDB Connection (Mongoose) ---
mongoose
  .connect(MONGO_URI, {
    dbName: DB_NAME,
  })
  .then(() => console.log("Mongoose connected to MongoDB"))
  .catch((err) => console.error("Mongoose connection error:", err));

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

// --- Helper Function: Get or Create Professor ID ---
const getProfessorId = async (db, professorName) => {
  const professorsCollection = db.collection(PROFESSORS_COLLECTION);

  try {
    const existingProfessor = await professorsCollection.findOne({
      prof_name: professorName,
    });

    if (existingProfessor) {
      console.log(
        `Found existing professor: ${professorName} with ID: ${existingProfessor.prof_id}`
      );
      return existingProfessor.prof_id;
    } else {
      console.log(`Professor ${professorName} not found. Creating new entry.`);

      const counterCollection = db.collection("counters");
      const sequenceDoc = await counterCollection.findOneAndUpdate(
        { _id: "professorId" },
        { $inc: { seq: 1 } },
        { returnDocument: "after", upsert: true }
      );

      if (!sequenceDoc || sequenceDoc.seq == null) {
        throw new Error("Failed to retrieve the next professor ID sequence.");
      }

      const nextId = sequenceDoc.seq;
      console.log(`Assigning new Professor ID: ${nextId}`);

      await professorsCollection.insertOne({
        prof_name: professorName,
        prof_id: nextId,
      });
      console.log(
        `Successfully inserted new professor mapping for ${professorName}.`
      );
      return nextId;
    }
  } catch (error) {
    if (error.code === 11000) {
      console.warn(
        `Duplicate key error (or race condition resolved by index) for professor: ${professorName}. Refetching ID.`
      );
      const justInsertedProfessor = await professorsCollection.findOne({
        prof_name: professorName,
      });
      if (justInsertedProfessor) {
        return justInsertedProfessor.prof_id;
      } else {
        throw new Error(
          `Failed to find professor ${professorName} after duplicate key error.`
        );
      }
    } else {
      console.error("Error in getProfessorId:", error);
      throw error;
    }
  }
};

// --- API Routes ---

// Register Route (+ Scrape and Store) - Handling FormData with Multer
app.post("/register", upload.single("profilePicture"), async (req, res) => {
  const {
    name,
    email,
    password,
    department,
    designation,
    introduction,
    scholarProfileUrl,
  } = req.body;
  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null; // Store path to the uploaded file

  // --- Input Validation ---
  if (!name || !email || !password || !department || !designation || !scholarProfileUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let mongoClient = null;

  try {
    // --- User Registration ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      department,
      designation,
      introduction,
      googleScholarUrl: scholarProfileUrl, // Store the URL
      profilePicture, // Store the file path
    });
    const savedUser = await newUser.save();
    console.log(`User ${email} registered successfully.`);
    const userId = savedUser.prof_id;

    // --- Scraping and Storing Publications ---
    console.log(
      `Starting scraping process for URL: ${scholarProfileUrl} associated with user ${email}`
    );

    // 1. Scrape Profile Data
    const profileData = await scrapeScholarProfile(scholarProfileUrl);

    // Validate scraper output
    if (!profileData || !profileData.name) {
      console.error(
        `Scraping Error: Failed to retrieve profile data or name for URL: ${scholarProfileUrl}`
      );
      // Don't necessarily fail the registration, but log the issue.
      // The user is registered, but scraping failed. Inform the user.
      // You might want a separate mechanism to retry scraping later.
      return res.status(201).json({
        message:
          "User registered successfully, but failed to scrape profile data. Please check the Google Scholar URL or try again later.",
        userId: userId, // Send back user ID
        scrapeStatus: "failed",
      });
    }
    console.log(
      `Scraping successful for: ${profileData.name} from URL: ${scholarProfileUrl}`
    );

    // 2. Connect to MongoDB (using MongoClient for direct access if needed, e.g., for getProfessorId)
    // Re-use Mongoose connection if `getProfessorId` doesn't strictly need MongoClient
    console.log("Connecting to MongoDB via MongoClient for publication storage...");
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    console.log(`MongoClient connected to DB: ${DB_NAME}`);

    // 3. Get or Create Professor ID
    // Ensure the scraped name matches the registered user's name or handle discrepancies
    // For now, we assume the scraped name is the primary identifier for publications.
    const professorId = await getProfessorId(db, profileData.name);

    // 4. Handle Case of No Publications Found
    if (!profileData.publications || profileData.publications.length === 0) {
      console.log(
        `No publications found for ${profileData.name}. Nothing to insert.`
      );
      return res.status(201).json({
        message: `User registered. Scraping successful, but no publications found for ${profileData.name}.`,
        userId: userId,
        professorName: profileData.name,
        professorId: professorId,
        insertedCount: 0,
        scrapeStatus: "success_no_publications",
      });
    }

    // 5. Prepare Publication Documents for Insertion
    const documentsToInsert = profileData.publications.map((pub) => ({
      prof_name: profileData.name, // Link publication to the scraped name
      prof_id: professorId, // Link using the generated/found ID
      paper_title: pub.title,
      paper_authors: pub.authors, // Assuming scraper provides authors
      paper_venue: pub.venue, // Assuming scraper provides venue/journal
      paper_year: pub.year,
      // Add other relevant fields scraped (e.g., citations, URL)
    }));
    console.log(
      `Prepared ${documentsToInsert.length} publication documents for insertion.`
    );

    // 6. Insert Publication Documents
    const publicationsCollection = db.collection(PUBLICATIONS_COLLECTION);
    const insertResult = await publicationsCollection.insertMany(
      documentsToInsert,
      { ordered: false } // Continue inserting even if some docs fail (e.g., duplicates if not handled)
    );
    console.log(
      `Successfully inserted ${insertResult.insertedCount} documents into ${PUBLICATIONS_COLLECTION}.`
    );

    // 7. Send Success Response (User Registered & Publications Stored)
    return res.status(201).json({
      message: `User registered. Successfully scraped and stored ${insertResult.insertedCount} publications.`,
      userId: userId,
      professorName: profileData.name,
      professorId: professorId,
      insertedCount: insertResult.insertedCount,
      scrapeStatus: "success",
    });
  } catch (error) {
    console.error("\n--- /register Endpoint Error ---");
    console.error(error); // Log the full error for debugging

    // Determine the type of error for a more specific response
    let statusCode = 500;
    let message = "An internal server error occurred during registration.";

    if (error instanceof MongoNetworkError) {
      message = "Database connection error.";
    } else if (error.name && error.name.includes("Mongo")) {
      // Includes Mongoose errors and MongoClient errors
      message = "Database operation error.";
      if (error.code === 11000) {
        // Specific duplicate key error (e.g., during user save)
        message = "Database error: Duplicate entry.";
        statusCode = 400; // Bad request due to duplicate
      }
    } else if (error.message.toLowerCase().includes("scrape")) {
      // Basic check if it's likely a scraping error
      message = "Error during scraping process.";
      // Decide if this should be a 500 or maybe a different status if user was created
    } else if (error.message.includes("Failed to retrieve the next professor ID")) {
        message = "Error generating professor ID.";
    } else if (error.name === 'ValidationError') { // Mongoose validation error
        statusCode = 400;
        message = "Validation Error: " + error.message;
    }

    res.status(statusCode).json({
      error: message,
      details: error.message, // Optionally include more details in dev mode
    });
    console.error("--- End of Error ---");
  } finally {
    // 8. Ensure MongoClient connection is closed if it was opened
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log("MongoClient connection closed.");
      } catch (closeError) {
        console.error("Error closing MongoClient connection:", closeError);
      }
    }
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" }); // User not found
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" }); // Password doesn't match
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id, // Include user ID in the payload
        name: user.name, // Optionally include other non-sensitive info
      },
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "1h", // Use env var for expiration
    });

    // Send token (and optionally user info) back to client
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }, // Send back some user details
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/api/faculty/:profId", async (req, res) => {
  try {
    // Extract the professor ID from the URL parameters
    const profId = req.params.profId;

    // --- Input Validation (Optional but recommended) ---
    // If PROF_ID is expected to be a MongoDB ObjectId, validate it
    if (!mongoose.Types.ObjectId.isValid(profId)) {
        return res.status(400).json({ message: "Invalid Professor ID format" });
    }
    // --- End Validation ---


    console.log(profId);
    // Find all publications associated with this professor ID
    // ASSUMPTION: Your Publication model has a field like 'professorId'
    // that stores the ObjectId of the related professor.
    const publications = await Publication.find({ prof_id: profId });

    // If no publications are found for this ID, publications will be an empty array [],
    // which is usually an acceptable response indicating no publications exist for the professor.
    // You could optionally check if the professor themselves exists first if needed,
    // but fetching publications directly is often sufficient.

    console.log(publications);
    res.status(200).json(publications);

  } catch (error) {
    console.error(`Error fetching publications for professor ${req.params.profId}:`, error);

    // Handle specific errors if necessary (e.g., casting errors for invalid IDs)
    if (error instanceof mongoose.Error.CastError) {
         return res.status(400).json({ message: "Invalid ID format" });
    }

    res.status(500).json({ message: "Server Error fetching publications" });
  }
});

// --- Simple Root Route (Optional) ---
app.get("/", (req, res) => {
  res.send("API is running...");
});

// --- Start the Server ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
