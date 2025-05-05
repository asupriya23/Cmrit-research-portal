// Import the scraping function
const { scrapeScholarProfile } = require('./scrapers/googleScholarScraper'); // Adjust path if needed

// Import MongoClient from the MongoDB driver
const { MongoClient } = require('mongodb');

// --- Configuration ---
// The URL provided for scraping
const scholarUrl = "https://scholar.google.co.in/citations?user=O-FbnpAAAAAJ&hl=en";

// Your MongoDB Connection String
const MONGO_URI = "mongodb+srv://anshikasupriya2308:priya2308@cluster0.qjcookb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Define Database and Collection names
const DB_NAME = "scholarData"; // Choose a suitable database name
const COLLECTION_NAME = "publications";

// Define the starting Professor ID (IMPORTANT: See note below)
let currentProfessorId = 1;
// --- End Configuration ---


// Define an async function to run the scrape and store process
const runScrapeAndStore = async (urlToScrape, professorId) => {
  console.log(`--- Starting Google Scholar Scrape & Store ---`);
  console.log(`Target URL: ${urlToScrape}`);
  console.log(`Assigned Professor ID: ${professorId}`);

  let mongoClient; // Declare client variable here to access in finally block

  try {
    // 1. Scrape the profile data
    const profileData = await scrapeScholarProfile(urlToScrape);

    // 2. Check if scraping was successful and publications exist
    if (profileData && profileData.name && profileData.publications && profileData.publications.length > 0) {
      console.log(`\n--- Scraping Successful ---`);
      console.log(`Name: ${profileData.name}`);
      console.log(`Affiliation: ${profileData.affiliation}`); // Kept for logging, not stored in this schema
      console.log(`Found ${profileData.publications.length} publications for ${profileData.name}.`);

      // 3. Prepare documents for MongoDB
      const documentsToInsert = profileData.publications.map(pub => ({
        prof_name: profileData.name, // Professor's name
        prof_id: professorId,       // Assigned Professor ID
        paper_title: pub.title,     // Publication title
        paper_year: pub.year        // Publication year
      }));

      console.log(`\nPreparing to insert ${documentsToInsert.length} documents into MongoDB...`);

      // 4. Connect to MongoDB
      console.log(`Connecting to MongoDB at ${MONGO_URI.substring(0, 30)}...`); // Log URI partially for security
      mongoClient = new MongoClient(MONGO_URI);
      await mongoClient.connect();
      console.log("Successfully connected to MongoDB.");

      // 5. Select Database and Collection
      const db = mongoClient.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);
      console.log(`Using database '${DB_NAME}' and collection '${COLLECTION_NAME}'.`);

      // 6. Insert the documents into the collection
      const insertResult = await collection.insertMany(documentsToInsert);
      console.log(`\n--- Database Insertion Successful ---`);
      console.log(`${insertResult.insertedCount} documents inserted successfully.`);
      console.log(`Inserted IDs:`, insertResult.insertedIds); // Log the MongoDB _id values

    } else if (profileData) {
      console.log(`\n--- Scraping Successful but No Publications Found ---`);
      console.log(`Scraped data for ${profileData.name}, but no publications were listed or extracted.`);
    } else {
      console.log(`\n--- Scraping Failed ---`);
      console.log("The scrape function returned no data. Cannot proceed with database insertion.");
    }

  } catch (error) {
    // Catch any errors during scraping or database operations
    console.error(`\n--- Process Error ---`);
    if (error.name === 'MongoNetworkError') {
         console.error("MongoDB Connection Error:", error.message);
         console.error("Please check your MONGO_URI, network connection, and IP allowlist settings in MongoDB Atlas.");
    } else if (error.name && error.name.includes('Mongo')) { // Catch other potential Mongo errors
        console.error("MongoDB Operation Error:", error);
    } else {
        console.error("An error occurred during the scrape or store process:", error);
    }
    console.error(`--- End of Error ---`);
  } finally {
    // 7. Ensure the MongoDB connection is closed
    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log("\nMongoDB connection closed.");
      } catch (closeError) {
          console.error("Error closing MongoDB connection:", closeError);
      }
    }
    console.log(`\n--- Google Scholar Scrape & Store Finished ---`);
  }
};

// --- IMPORTANT NOTE ON PROFESSOR ID ---
// The current `currentProfessorId = 1` is just a placeholder for this single execution.
// In a real application where you scrape multiple professors, you would need a proper way
// to manage and increment this ID. Options include:
// 1. Querying your MongoDB 'publications' or a separate 'professors' collection
//    to find the maximum existing `prof_id` and adding 1.
// 2. Passing the ID as a command-line argument or getting it from a job queue system.
// 3. Using MongoDB's auto-incrementing features (though this often requires more setup).
// For this example, we'll just use the hardcoded ID.

// Run the main function with the URL and the assigned ID
runScrapeAndStore(scholarUrl, currentProfessorId);