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
const User = require("./models/User"); // Ensure User model has user_id: { type: Number, unique: true, required: true }
const Publication = require("./models/Publication");
const { runScrapeAndStoreService } = require("./scrape"); // Import the service

// --- Import Middleware ---
const authenticate = require("./middleware/auth");

// --- Import Scrapers ---
const { scrapeScholarProfile } = require("./scrapers/googleScholarScraper");

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

    const profileData = await scrapeScholarProfile(scholarProfileUrl);

    if (!profileData || !profileData.name) {
      console.error(
        `Scraping Error: Failed to retrieve profile data or name for URL: ${scholarProfileUrl}`
      );
      return res.status(201).json({
        // User is registered, but scraping had issues
        message:
          "User registered successfully, but failed to scrape profile data. Please check the Google Scholar URL or try again later.",
        userId: savedUser.user_id,
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
        userId: savedUser.user_id,
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
      "Connecting to MongoDB via MongoClient for registration operations..."
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
    const profileData = await scrapeScholarProfile(scholarProfileUrl);

    if (!profileData || !profileData.name) {
      console.error(
        `Scraping Error: Failed to retrieve profile data or name for URL: ${scholarProfileUrl}`
      );
      return res.status(201).json({
        // User is registered, but scraping had issues
        message:
          "User registered successfully, but failed to scrape profile data. Please check the Google Scholar URL or try again later.",
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
      return res.status(201).json({
        // User registered, scraping done, no publications
        message: `User registered. Scraping successful, but no publications found for ${profileData.name}.`,
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

    return res.status(201).json({
      message: `User logged in with ID ${savedUser.user_id}. Successfully scraped and stored ${insertResult.insertedCount} publications.`,
      userId: savedUser.user_id, // The auto-incremented ID of the registered user
      professorName: profileData.name, // Scraped professor's name
      professorId: professorIdForPublications, // ID associated with the scraped professor's publications
      insertedCount: insertResult.insertedCount,
      scrapeStatus: "success",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
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

// --- Simple Root Route (Optional) ---
app.get("/", (req, res) => {
  res.send("API is running...");
});

// --- Start the Server ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
