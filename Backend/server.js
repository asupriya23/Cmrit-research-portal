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
const nodemailer = require("nodemailer");
const cron = require("node-cron");

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
const User = require("./models/User"); // Ensure User model has user_id: { type: Number, unique: true, required: true }
const Publication = require("./models/Publication");
const { runScrapeAndStoreService } = require("./scrape"); // Import the service

// --- Import Middleware ---
const authenticate = require("./middleware/auth");

// --- Import Scrapers ---
// NOTE: don't require the scraper (which pulls in Puppeteer) at top-level.
// Lazy-require it inside routes so the server can start even if Puppeteer
// is missing or not yet installed. See README or troubleshooting notes.

// --- Initialize Express App ---
const app = express();

// --- Middleware Setup ---
const corsOptions = {
  origin: "http://localhost:5173", // Adjust if your frontend runs elsewhere
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

// --- Helper Function: Get Next Sequence Value ---
const getNextSequenceValue = async (db, sequenceName) => {
  const counterCollection = db.collection("counters");
  try {
    const sequenceDoc = await counterCollection.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );

    if (sequenceDoc && sequenceDoc.seq != null) {
      return sequenceDoc.seq;
    } else {
      // This case should be rare with upsert: true and successful $inc
      console.error(
        `Counter for ${sequenceName} returned null or seq is missing after update. Doc:`,
        sequenceDoc
      );
      // Attempt a re-read as a fallback
      const fallbackDoc = await counterCollection.findOne({
        _id: sequenceName,
      });
      if (fallbackDoc && fallbackDoc.seq != null) {
        console.warn(
          `Fallback read for ${sequenceName} found seq: ${fallbackDoc.seq}`
        );
        return fallbackDoc.seq;
      }
      throw new Error(
        `Failed to retrieve or initialize the next sequence for ${sequenceName}.`
      );
    }
  } catch (error) {
    console.error(`Error in getNextSequenceValue for ${sequenceName}:`, error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// --- Helper Function: Get or Create Professor ID ---
const getProfessorId = async (db, professorName) => {
  const professorsCollection = db.collection(PROFESSORS_COLLECTION);
  try {
    const existingProfessor = await professorsCollection.findOne({
      prof_name: professorName,
    });

    if (existingProfessor) {
      console.log(
        `Found existing professor: ${professorName} with ID: ${existingProfessor.user_id}`
      );
      return existingProfessor.user_id;
    } else {
      console.log(`Professor ${professorName} not found. Creating new entry.`);
      // Use the generalized sequence generator, e.g. "professorIdCounter"
      const nextId = await getNextSequenceValue(db, "professorId"); // Using "professorId" as sequence name as in original logic
      console.log(`Assigning new Professor ID: ${nextId} for ${professorName}`);

      await professorsCollection.insertOne({
        prof_name: professorName,
        user_id: nextId,
      });
      console.log(
        `Successfully inserted new professor mapping for ${professorName}.`
      );
      return nextId;
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error on prof_name index
      console.warn(
        `Duplicate key error (or race condition resolved by index) for professor: ${professorName}. Refetching ID.`
      );
      const justInsertedProfessor = await professorsCollection.findOne({
        prof_name: professorName,
      });
      if (justInsertedProfessor) {
        return justInsertedProfessor.user_id;
      } else {
        throw new Error(
          `Failed to find professor ${professorName} after duplicate key error on name.`
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
    scholarProfileUrl
  } = req.body;
  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  if (
    !name ||
    !email ||
    !password ||
    !department ||
    !designation ||
    !scholarProfileUrl
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let mongoClient = null;

  try {
    // 1. Connect to MongoDB (using MongoClient for direct DB operations like counters)
    console.log(
      "Connecting to MongoDB via MongoClient for registration operations..."
    );
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    console.log(`MongoClient connected to DB: ${DB_NAME}`);

    // 2. Check if user already exists (using Mongoose model)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // No need to keep mongoClient open if user exists
      // await mongoClient.close(); // mongoClient will be closed in finally block
      return res.status(400).json({ error: "User already exists" });
    }

    // 3. Generate New User ID using the counter
    // This ID will be stored in the User model's 'user_id' field.
    const newUserId = await getNextSequenceValue(db, "userCounter"); // "userCounter" is the sequence name for user IDs
    console.log(`Generated new User ID (for User.user_id): ${newUserId}`);

    // 4. User Registration (Create and Save New User)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

      // Lazy-require the scraper to avoid crashing the server at startup
      // if Puppeteer or its browser artifacts are not installed.
      let profileData;
      try {
        const { scrapeScholarProfile } = require("./scrapers/googleScholarScraper");
        profileData = await scrapeScholarProfile(scholarProfileUrl);
      } catch (err) {
        console.error("Failed to load scraper (deferred require):", err);
        profileData = null;
      }

    if (!profileData || !profileData.name) {
      console.error(
        `Scraping Error: Failed to retrieve profile data or name for URL: ${scholarProfileUrl}`
      );
      return res.status(201).json({
        // User is registered, but scraping had issues
        message:
          "User registered successfully, but failed to scrape profile data. Please check the Google Scholar URL or try again later.",
        // userId: savedUser.user_id,
        scrapeStatus: "failed_profile_data",
      });
    }
    console.log(
      `Scraping successful for: ${profileData.name} from URL: ${scholarProfileUrl}`
    );

    // console.log(profileData);

    const newUser = new User({
      user_id: newUserId, // Assign the auto-incremented ID
      name,
      email,
      password: hashedPassword,
      department,
      designation,
      introduction,
      googleScholarUrl: scholarProfileUrl,
      profilePicture,
      citationCount: profileData.citationCount,
      hIndex: profileData.hIndex,
      i10Index: profileData.i10Index,
      citationHistory: profileData.citationHistory
    });

    console.log(newUser);

    const savedUser = await newUser.save(); // Mongoose save operation
    console.log(
      `User ${email} registered successfully with user_id: ${savedUser.user_id}.`
    );
    // const userIdForResponse = savedUser.user_id; // This is the auto-incremented ID

    // --- Scraping and Storing Publications ---
    console.log(
      `Starting scraping process for URL: ${scholarProfileUrl} associated with user ${email}`
    );

    // Get or Create Professor ID for the scraped profile's publications
    // The 'db' object from our mongoClient is passed to getProfessorId
    const professorIdForPublications = await getProfessorId(
      db,
      profileData.name
    );

    if (!profileData.publications || profileData.publications.length === 0) {
      console.log(
        `No publications found for ${profileData.name}. Nothing to insert.`
      );
      return res.status(201).json({
        // User registered, scraping done, no publications
        message: `User registered. Scraping successful, but no publications found for ${profileData.name}.`,
        // userId: savedUser.user_id,
        professorName: profileData.name,
        professorId: professorIdForPublications,
        insertedCount: 0,
        scrapeStatus: "success_no_publications",
      });
    }

    const documentsToInsert = profileData.publications.map((pub) => ({
      prof_name: profileData.name,
      user_id: professorIdForPublications,
      paper_title: pub.title,
      paper_journal: pub.journal,
      paper_year: pub.year,
      paper_authors: pub.authors
    }));
    console.log(
      `Prepared ${documentsToInsert.length} publication documents for insertion.`
    );

    const publicationsCollection = db.collection(PUBLICATIONS_COLLECTION);
    const insertResult = await publicationsCollection.insertMany(
      documentsToInsert,
      { ordered: false }
    );
    console.log(
      `Successfully inserted ${insertResult.insertedCount} documents into ${PUBLICATIONS_COLLECTION}.`
    );

    return res.status(201).json({
      message: `User registered with ID ${savedUser.user_id}. Successfully scraped and stored ${insertResult.insertedCount} publications.`,
      userId: savedUser.user_id, // The auto-incremented ID of the registered user
      professorName: profileData.name, // Scraped professor's name
      professorId: professorIdForPublications, // ID associated with the scraped professor's publications
      insertedCount: insertResult.insertedCount,
      scrapeStatus: "success",
    });
  } catch (error) {
    console.error("\n--- /register Endpoint Error ---");
    console.error(error);

    let statusCode = 500;
    let responseMessage =
      "An internal server error occurred during registration."; // Renamed to avoid conflict

    if (error instanceof MongoNetworkError) {
      responseMessage = "Database connection error.";
    } else if (
      error.name === "MongoServerError" ||
      error.name === "MongoError" ||
      (error.message && error.message.includes("mongo"))
    ) {
      responseMessage = "Database operation error.";
      if (error.code === 11000) {
        // Duplicate key error
        if (error.message.includes("email")) {
          // Check if duplication is on email
          responseMessage = "User with this email already exists.";
        } else if (error.message.includes("user_id")) {
          // Check if duplication is on user's user_id
          responseMessage =
            "User ID generation conflict. This is rare; please try again.";
        } else {
          responseMessage =
            "Database error: A unique field already has this value.";
        }
        statusCode = 400;
      }
    } else if (
      error.message &&
      error.message.toLowerCase().includes("scrape")
    ) {
      responseMessage = "Error during scraping process.";
    } else if (
      error.message &&
      error.message.includes(
        "Failed to retrieve or initialize the next sequence"
      )
    ) {
      responseMessage =
        "Error generating a unique ID for the user or professor.";
    } else if (error.name === "ValidationError") {
      // Mongoose validation error
      statusCode = 400;
      responseMessage = "Validation Error: " + error.message;
    }

    res.status(statusCode).json({
      error: responseMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined, // More details in dev
    });
  } finally {
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

  let mongoClient = null;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" }); // User not found
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" }); // Password doesn't match
    }

    // 1. Connect to MongoDB (using MongoClient for direct DB operations like counters)
    console.log(
      "Connecting to MongoDB via MongoClient for login operations..."
    );
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    console.log(`MongoClient connected to DB: ${DB_NAME}`);

    console.log(user);
    const savedUser = user;
    const scholarProfileUrl = savedUser.googleScholarUrl;

    // --- Scraping and Storing Publications ---
    console.log(
      `Starting scraping process for URL: ${scholarProfileUrl} associated with user ${email}`
    );

    // Lazy-require the scraper here as well to avoid startup failures
    let profileData;
    try {
      const { scrapeScholarProfile } = require("./scrapers/googleScholarScraper");
      profileData = await scrapeScholarProfile(scholarProfileUrl);
    } catch (err) {
      console.error("Failed to load scraper (deferred require) during login path:", err);
      profileData = null;
    }

    if (!profileData || !profileData.name) {
      console.error(
        `Scraping Error: Failed to retrieve profile data or name for URL: ${scholarProfileUrl}`
      );
      return res.status(200).json({
        // User logged in, but scraping had issues
        message:
          "User logged in successfully, but failed to scrape profile data. Please check the Google Scholar URL or try again later.",
        userId: savedUser.user_id,
        scrapeStatus: "failed_profile_data",
      });
    }
    console.log(
      `Scraping successful for: ${profileData.name} from URL: ${scholarProfileUrl}`
    );

    // Get or Create Professor ID for the scraped profile's publications
    // The 'db' object from our mongoClient is passed to getProfessorId
    const professorIdForPublications = await getProfessorId(
      db,
      profileData.name
    );

    if (!profileData.publications || profileData.publications.length === 0) {
      console.log(
        `No publications found for ${profileData.name}. Nothing to insert.`
      );
      return res.status(200).json({
        // User logged in, scraping done, no publications
        message: `User logged in. Scraping successful, but no publications found for ${profileData.name}.`,
        userId: savedUser.user_id,
        professorName: profileData.name,
        professorId: professorIdForPublications,
        insertedCount: 0,
        scrapeStatus: "success_no_publications",
      });
    }

    const documentsToInsert = profileData.publications.map((pub) => ({
      prof_name: profileData.name,
      user_id: professorIdForPublications, // ID for the professor whose publications these are
      paper_title: pub.title,
      paper_journal: pub.journal,
      paper_year: pub.year,
      paper_authors: pub.authors,
      // citationCount: pub.citationCount,
      // hIndex: pub.hIndex,
      // i10Index: pub.i10Index,
    }));
    console.log(
      `Prepared ${documentsToInsert.length} publication documents for insertion.`
    );

    const publicationsCollection = db.collection(PUBLICATIONS_COLLECTION);
    const insertResult = await publicationsCollection.insertMany(
      documentsToInsert,
      { ordered: false }
    );
    console.log(
      `Successfully inserted ${insertResult.insertedCount} documents into ${PUBLICATIONS_COLLECTION}.`
    );

    return res.status(200).json({
      message: `User logged in with ID ${savedUser.user_id}. Successfully scraped and stored ${insertResult.insertedCount} publications.`,
      userId: savedUser.user_id, // The auto-incremented ID of the logged-in user
      professorName: profileData.name, // Scraped professor's name
      professorId: professorIdForPublications, // ID associated with the scraped professor's publications
      insertedCount: insertResult.insertedCount,
      scrapeStatus: "success",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  } finally {
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log("MongoClient connection closed (login route).");
      } catch (closeError) {
        console.error("Error closing MongoClient connection (login):", closeError);
      }
    }
  }
});

app.get("/api/faculty/:profId", async (req, res) => {
  try {
    const profIdParam = req.params.profId;
    const numericUserId = parseInt(profIdParam, 10);

    console.log(numericUserId);
    if (isNaN(numericUserId)) {
      return res
        .status(400)
        .json({ message: "Invalid Faculty ID format. Must be a number." });
    }

    // 1. Find the user in your database
    const facultyUser = await User.findOne({ user_id: numericUserId });

    if (!facultyUser) {
      return res.status(404).json({ message: "Faculty user not found." });
    }

    if (!facultyUser.googleScholarUrl) {
      console.log(
        `User ${numericUserId} does not have a Google Scholar URL configured.`
      );
      // Fetch existing publications if any, but don't attempt to scrape.
      const existingPublications = await Publication.find({
        user_id: numericUserId,
      });
      return res.status(200).json({
        message:
          "Google Scholar URL not configured for this user. Displaying cached publications.",
        publications: existingPublications,
      });
    }

    // --- Automatic Scraping Logic ---
    // WARNING: This will make the API call slow and has other implications mentioned above.
    // Consider adding a condition, e.g., scrape only if lastScrapedAt is older than X days.
    console.log(
      `Attempting to scrape publications for User ID: ${numericUserId} from ${facultyUser.googleScholarUrl}`
    );
    const scrapeResult = await runScrapeAndStoreService(
      facultyUser.googleScholarUrl,
      numericUserId
    );

    if (scrapeResult.success) {
      console.log(
        `Scraping successful for User ID ${numericUserId}. Name: ${scrapeResult.name}, Inserted: ${scrapeResult.insertedCount}`
      );
      // Update lastScrapedAt timestamp for the user
      facultyUser.lastScrapedAt = new Date();
      await facultyUser.save();
    } else {
      console.warn(
        `Scraping failed or returned no new data for User ID ${numericUserId}: ${scrapeResult.message}`
      );
      // You might still want to return any previously fetched data in case of scrape failure.
      // Or, return an error specific to the scrape failure.
      // For this example, we'll proceed to fetch whatever is in the DB.
    }
    // --- End Automatic Scraping Logic ---

    // 2. Fetch publications from the database (these will be the latest after the scrape attempt)
    const publications = await Publication.find({ user_id: numericUserId });
    console.log(
      `Returning ${publications.length} publications for User ID ${numericUserId} after scrape attempt.`
    );

    // console.log(publications);
    res.status(200).json(publications);
  } catch (error) {
    console.error(`Error in /api/faculty/${req.params.profId} route:`, error);
    res
      .status(500)
      .json({ message: "Server Error processing faculty request" });
  }
});

app.get("/details/:profId", async (req, res) => {
  try {
    const profIdParam = req.params.profId;
    // Ensure profIdParam is parsed as a number for database queries
    const numericUserId = parseInt(profIdParam, 10);

    // Log the parsed ID for debugging
    console.log("Requested Faculty ID (parsed):", numericUserId);

    // Validate that numericUserId is a number
    if (isNaN(numericUserId)) {
      return res
        .status(400)
        .json({ message: "Invalid Faculty ID format. Must be a number." });
    }

    // 1. Find the user in your database (Users Collection)
    // We assume 'user_id' is a field in your User model that stores the numeric ID.
    const facultyUser = await User.findOne({ user_id: numericUserId });

    // Handle case where no user is found with that ID
    if (!facultyUser) {
      return res.status(404).json({ message: "Faculty user not found." });
    }

    // Check if the user has a Google Scholar URL configured
    if (!facultyUser.googleScholarUrl) {
      console.log(
        `User ${numericUserId} does not have a Google Scholar URL configured.`
      );
      // If no Google Scholar URL, fetch existing publications from the Publication collection.
      // This part assumes you have a Publication model and 'user_id' links it to the User.
      const existingPublications = await Publication.find({
        user_id: numericUserId, // Ensure this field matches your Publication schema
      });
      return res.status(200).json({
        message:
          "Google Scholar URL not configured for this user. Displaying cached publications.",
        publications: existingPublications,
        // Note: This branch currently only returns publications.
        // You might consider returning facultyUser details here as well for API consistency:
        // facultyDetails: facultyUser,
      });
    }

    // WRTIE CODE HERE
    // FETCH ALLL DETAILS FROM USERS COLLECTION AND RETURN THAT
    // The 'facultyUser' variable, fetched above, already contains all details 
    // for this user from the User collection.
    // So, we return the facultyUser object directly.
    // If scraping or other operations related to the Google Scholar URL were to be performed,
    // they would typically happen before this response.
    return res.status(200).json(facultyUser);

  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error(`Error in /details/${req.params.profId} route:`, error);
    // Send a generic error message to the client
    res
      .status(500)
      .json({ message: "Server Error processing faculty details" });
  }
});

app.get("/api/getAllFaculty", async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching all faculty:", error);
    res.status(500).json({ message: "Failed to retrieve faculty data." });
  }
});

// Delete a user/profile and their publications
// This route accepts either a valid JWT in Authorization header, or a
// local header 'x-local-userid' containing the numeric user_id for dev flows.
app.delete("/api/users/:userId", async (req, res) => {
  try {
    const userIdParam = parseInt(req.params.userId, 10);
    if (isNaN(userIdParam)) {
      return res.status(400).json({ message: "Invalid userId parameter" });
    }

    let requesterNumericId = null;

    // Try Authorization header (Bearer token)
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Payload shapes can vary; support a few common fields
        if (payload.user_id && typeof payload.user_id === "number") requesterNumericId = payload.user_id;
        if (!requesterNumericId && payload.userId && typeof payload.userId === "number") requesterNumericId = payload.userId;
        if (!requesterNumericId && payload.userId && typeof payload.userId === "string") {
          const found = await User.findOne({ _id: payload.userId });
          if (found) requesterNumericId = found.user_id;
        }
      } catch (err) {
        // Token invalid or expired - fall-through to other checks
        console.warn("Invalid token provided for deletion route");
      }
    }

    // Fallback: allow a dev header 'x-local-userid' (numeric) so local UI can
    // request deletion without a token. This is intentional for dev convenience.
    if (!requesterNumericId) {
      const localHeader = req.header("x-local-userid");
      if (localHeader) {
        const parsed = parseInt(localHeader, 10);
        if (!isNaN(parsed)) requesterNumericId = parsed;
      }
    }

    if (requesterNumericId !== userIdParam) {
      return res.status(403).json({ message: "Forbidden: cannot delete another user's profile." });
    }

    // Delete publications associated with this numeric user id
    await Publication.deleteMany({ user_id: userIdParam });

    // Delete the user document
    const deleteResult = await User.deleteOne({ user_id: userIdParam });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User and associated publications deleted" });
  } catch (error) {
    console.error("Error deleting user/profile:", error);
    return res.status(500).json({ message: "Server error deleting user" });
  }
});

app.get("/details/:profId", async (req, res) => {
  try {
    const profIdParam = req.params.profId;
    // Ensure profIdParam is parsed as a number for database queries
    const numericUserId = parseInt(profIdParam, 10);

    // Log the parsed ID for debugging
    console.log("Requested Faculty ID (parsed):", numericUserId);

    // Validate that numericUserId is a number
    if (isNaN(numericUserId)) {
      return res
        .status(400)
        .json({ message: "Invalid Faculty ID format. Must be a number." });
    }

    // 1. Find the user in your database (Users Collection)
    // We assume 'user_id' is a field in your User model that stores the numeric ID.
    const facultyUser = await User.findOne({ user_id: numericUserId });

    // Handle case where no user is found with that ID
    if (!facultyUser) {
      return res.status(404).json({ message: "Faculty user not found." });
    }

    // Check if the user has a Google Scholar URL configured
    if (!facultyUser.googleScholarUrl) {
      console.log(
        `User ${numericUserId} does not have a Google Scholar URL configured.`
      );
      // If no Google Scholar URL, fetch existing publications from the Publication collection.
      // This part assumes you have a Publication model and 'user_id' links it to the User.
      const existingPublications = await Publication.find({
        user_id: numericUserId, // Ensure this field matches your Publication schema
      });
      return res.status(200).json({
        message:
          "Google Scholar URL not configured for this user. Displaying cached publications.",
        publications: existingPublications,
        // Note: This branch currently only returns publications.
        // You might consider returning facultyUser details here as well for API consistency:
        // facultyDetails: facultyUser,
      });
    }

    // WRTIE CODE HERE
    // FETCH ALLL DETAILS FROM USERS COLLECTION AND RETURN THAT
    // The 'facultyUser' variable, fetched above, already contains all details 
    // for this user from the User collection.
    // So, we return the facultyUser object directly.
    // If scraping or other operations related to the Google Scholar URL were to be performed,
    // they would typically happen before this response.
    return res.status(200).json(facultyUser);

  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error(`Error in /details/${req.params.profId} route:`, error);
    // Send a generic error message to the client
    res
      .status(500)
      .json({ message: "Server Error processing faculty details" });
  }
});

// --- Analytics Endpoints ---

// Get publication trends for a faculty (papers per year)
app.get("/api/analytics/faculty/:userId/trends", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const publications = await Publication.find({ user_id: userId });
    
    // Group by year
    const yearCounts = {};
    publications.forEach(pub => {
      const year = pub.paper_year || "Unknown";
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    const trends = Object.keys(yearCounts)
      .filter(year => year !== "Unknown" && !isNaN(parseInt(year)))
      .sort()
      .map(year => ({ year: parseInt(year), count: yearCounts[year] }));

    res.json({ userId, trends });
  } catch (error) {
    console.error("Error fetching publication trends:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get research topics/keywords for a faculty (extracted from publication titles)
app.get("/api/analytics/faculty/:userId/topics", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const publications = await Publication.find({ user_id: userId });
    
    // Simple keyword extraction from titles (case-insensitive, common words filtered)
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'with', 'using', 'based', 'by', 'from', 'as', 'is', 'are', 'was', 'were']);
    const wordCounts = {};
    
    publications.forEach(pub => {
      const title = (pub.paper_title || "").toLowerCase();
      const words = title.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Get top 10 keywords
    const topics = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ topic: word, count }));

    res.json({ userId, topics });
  } catch (error) {
    console.error("Error extracting topics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get department-level analytics
app.get("/api/analytics/department/:department", async (req, res) => {
  try {
    const department = req.params.department;
    
    // Get all faculty in department
    const facultyMembers = await User.find({ department });
    
    if (facultyMembers.length === 0) {
      return res.status(404).json({ message: "No faculty found in department" });
    }

    // Calculate aggregates
    const totalCitations = facultyMembers.reduce((sum, f) => sum + (f.citationCount || 0), 0);
    const avgHIndex = facultyMembers.reduce((sum, f) => sum + (f.hIndex || 0), 0) / facultyMembers.length;
    const avgI10Index = facultyMembers.reduce((sum, f) => sum + (f.i10Index || 0), 0) / facultyMembers.length;
    
    // Get all publications for the department
    const userIds = facultyMembers.map(f => f.user_id);
    const publications = await Publication.find({ user_id: { $in: userIds } });
    
    // Publication trends by year
    const yearCounts = {};
    publications.forEach(pub => {
      const year = pub.paper_year;
      if (year && !isNaN(parseInt(year))) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    
    const publicationTrends = Object.keys(yearCounts)
      .sort()
      .map(year => ({ year: parseInt(year), count: yearCounts[year] }));

    // Extract department-wide topics
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'with', 'using', 'based', 'by', 'from', 'as', 'is', 'are', 'was', 'were']);
    const wordCounts = {};
    
    publications.forEach(pub => {
      const title = (pub.paper_title || "").toLowerCase();
      const words = title.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    const topTopics = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ topic: word, count }));

    res.json({
      department,
      facultyCount: facultyMembers.length,
      totalPublications: publications.length,
      totalCitations,
      avgHIndex: Math.round(avgHIndex * 10) / 10,
      avgI10Index: Math.round(avgI10Index * 10) / 10,
      publicationTrends,
      topTopics
    });
  } catch (error) {
    console.error("Error fetching department analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get comparison data for multiple faculty
app.post("/api/analytics/compare", async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length < 2) {
      return res.status(400).json({ message: "Provide at least 2 userIds in array" });
    }

    const numericIds = userIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    const facultyData = await Promise.all(numericIds.map(async (userId) => {
      const user = await User.findOne({ user_id: userId });
      if (!user) return null;

      const publications = await Publication.find({ user_id: userId });
      
      // Publication trends
      const yearCounts = {};
      publications.forEach(pub => {
        const year = pub.paper_year;
        if (year && !isNaN(parseInt(year))) {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });
      
      const trends = Object.keys(yearCounts)
        .sort()
        .map(year => ({ year: parseInt(year), count: yearCounts[year] }));

      return {
        userId: user.user_id,
        name: user.name,
        department: user.department,
        designation: user.designation,
        citationCount: user.citationCount || 0,
        hIndex: user.hIndex || 0,
        i10Index: user.i10Index || 0,
        publicationCount: publications.length,
        publicationTrends: trends
      };
    }));

    const validData = facultyData.filter(d => d !== null);
    res.json({ comparison: validData });
  } catch (error) {
    console.error("Error in comparison endpoint:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get top researchers leaderboard
app.get("/api/analytics/leaderboard/top-researchers", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Get top researchers by citation count
    const topByCitations = await User.find()
      .sort({ citationCount: -1 })
      .limit(limit)
      .select('user_id name department designation citationCount hIndex i10Index profilePic');
    
    res.json({ topResearchers: topByCitations });
  } catch (error) {
    console.error("Error fetching top researchers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get most active department
app.get("/api/analytics/leaderboard/most-active-department", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = req.query.year ? parseInt(req.query.year) : currentYear;
    
    // Get all publications for the specified year
    const publications = await Publication.find({ 
      paper_year: year.toString() 
    });
    
    // Get user_ids from publications
    const userIds = [...new Set(publications.map(p => p.user_id))];
    
    // Get users and group by department
    const users = await User.find({ user_id: { $in: userIds } });
    
    const departmentStats = {};
    
    users.forEach(user => {
      const dept = user.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          publicationsThisYear: 0,
          facultyCount: 0,
          totalCitations: user.citationCount || 0,
          avgHIndex: user.hIndex || 0
        };
      }
      departmentStats[dept].facultyCount++;
      departmentStats[dept].totalCitations += (user.citationCount || 0);
      departmentStats[dept].avgHIndex += (user.hIndex || 0);
    });
    
    // Count publications per department
    publications.forEach(pub => {
      const user = users.find(u => u.user_id === pub.user_id);
      if (user && user.department) {
        const dept = user.department;
        if (departmentStats[dept]) {
          departmentStats[dept].publicationsThisYear++;
        }
      }
    });
    
    // Calculate averages and sort
    const departmentList = Object.values(departmentStats).map(dept => ({
      ...dept,
      avgHIndex: dept.facultyCount > 0 ? Math.round((dept.avgHIndex / dept.facultyCount) * 10) / 10 : 0
    })).sort((a, b) => b.publicationsThisYear - a.publicationsThisYear);
    
    res.json({ 
      year,
      mostActiveDepartment: departmentList.length > 0 ? departmentList[0] : null,
      allDepartments: departmentList
    });
  } catch (error) {
    console.error("Error fetching most active department:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Email Configuration ---
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send monthly stats email
const sendMonthlyStatsEmail = async (user, publications) => {
  try {
    const currentYear = new Date().getFullYear();
    const thisYearPubs = publications.filter(p => p.paper_year === currentYear.toString());
    const totalCitations = publications.reduce((sum, p) => sum + (p.paper_citations || 0), 0);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Monthly Research Statistics',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Research Statistics Update</h2>
          <p>Dear ${user.name},</p>
          <p>Here's your monthly research statistics summary:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Overall Metrics</h3>
            <p><strong>Total Publications:</strong> ${publications.length}</p>
            <p><strong>Total Citations:</strong> ${user.citationCount || 0}</p>
            <p><strong>h-index:</strong> ${user.hIndex || 0}</p>
            <p><strong>i10-index:</strong> ${user.i10Index || 0}</p>
          </div>
          
          <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">This Year (${currentYear})</h3>
            <p><strong>Publications:</strong> ${thisYearPubs.length}</p>
          </div>
          
          ${publications.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>Your Top 3 Most Cited Publications</h3>
            ${publications
              .sort((a, b) => (b.paper_citations || 0) - (a.paper_citations || 0))
              .slice(0, 3)
              .map((pub, idx) => `
                <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #2563eb;">
                  <p style="margin: 5px 0;"><strong>${idx + 1}. ${pub.paper_title}</strong></p>
                  <p style="margin: 5px 0; color: #666;">Citations: ${pub.paper_citations || 0}</p>
                </div>
              `).join('')}
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">Keep up the great work!</p>
          <p>Best regards,<br>CMRIT Research Portal Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${user.email}:`, error);
    return false;
  }
};

// Function to rescrape all faculty profiles
const rescrapeAllProfiles = async () => {
  console.log('Starting monthly auto-refresh of all faculty profiles...');
  try {
    const users = await User.find({ googleScholarId: { $exists: true, $ne: '' } });
    console.log(`Found ${users.length} users to rescrape`);
    
    // Import scraper dynamically
    const scrapeProfile = require('./scrapers/googleScholarScraper');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        console.log(`Scraping profile for ${user.name} (${user.googleScholarId})...`);
        const scrapedData = await scrapeProfile(user.googleScholarId);
        
        if (scrapedData) {
          // Update user profile
          user.citationCount = scrapedData.citationCount || user.citationCount;
          user.hIndex = scrapedData.hIndex || user.hIndex;
          user.i10Index = scrapedData.i10Index || user.i10Index;
          await user.save();
          
          // Update publications
          if (scrapedData.publications && scrapedData.publications.length > 0) {
            for (const pub of scrapedData.publications) {
              await Publication.findOneAndUpdate(
                { 
                  user_id: user.user_id, 
                  paper_title: pub.paper_title 
                },
                {
                  ...pub,
                  user_id: user.user_id
                },
                { upsert: true, new: true }
              );
            }
          }
          
          successCount++;
          console.log(`Successfully updated profile for ${user.name}`);
        } else {
          errorCount++;
          console.log(`Failed to scrape data for ${user.name}`);
        }
        
        // Add delay to avoid overwhelming Google Scholar
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        errorCount++;
        console.error(`Error scraping ${user.name}:`, error.message);
      }
    }
    
    console.log(`Auto-refresh completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error in auto-refresh cron job:', error);
  }
};

// Manual endpoint to trigger rescrape
app.post("/api/admin/rescrape-all", async (req, res) => {
  try {
    // Start async process
    rescrapeAllProfiles();
    res.json({ message: "Rescrape process started. This may take several minutes." });
  } catch (error) {
    console.error("Error starting rescrape:", error);
    res.status(500).json({ message: "Failed to start rescrape process" });
  }
});

// Manual endpoint to send monthly email to specific user
app.post("/api/admin/send-stats-email/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await User.findOne({ user_id: userId });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.email) {
      return res.status(400).json({ message: "User has no email address" });
    }
    
    const publications = await Publication.find({ user_id: userId });
    const emailSent = await sendMonthlyStatsEmail(user, publications);
    
    if (emailSent) {
      res.json({ message: `Email sent successfully to ${user.email}` });
    } else {
      res.status(500).json({ message: "Failed to send email" });
    }
  } catch (error) {
    console.error("Error sending stats email:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to send monthly emails to all faculty
app.post("/api/admin/send-all-stats-emails", async (req, res) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: '' } });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        const publications = await Publication.find({ user_id: user.user_id });
        const emailSent = await sendMonthlyStatsEmail(user, publications);
        
        if (emailSent) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        console.error(`Error sending email to ${user.email}:`, error);
      }
    }
    
    res.json({ 
      message: `Email process completed. Sent: ${successCount}, Failed: ${errorCount}`,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error("Error sending all stats emails:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Cron Jobs ---
// Schedule monthly rescrape on 1st of every month at 2 AM
cron.schedule('0 2 1 * *', () => {
  console.log('Running scheduled monthly rescrape...');
  rescrapeAllProfiles();
});

// Schedule monthly email on 1st of every month at 9 AM
cron.schedule('0 9 1 * *', async () => {
  console.log('Sending monthly stats emails...');
  try {
    const users = await User.find({ email: { $exists: true, $ne: '' } });
    
    for (const user of users) {
      try {
        const publications = await Publication.find({ user_id: user.user_id });
        await sendMonthlyStatsEmail(user, publications);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
      }
    }
    
    console.log('Monthly stats emails sent');
  } catch (error) {
    console.error('Error in monthly email cron job:', error);
  }
});

console.log('Cron jobs scheduled:');
console.log('- Monthly rescrape: 1st of every month at 2:00 AM');
console.log('- Monthly emails: 1st of every month at 9:00 AM');

// --- Simple Root Route (Optional) ---
app.get("/", (req, res) => {
  res.send("API is running...");
});

// --- Start the Server ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
