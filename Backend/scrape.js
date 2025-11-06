// services/scraperService.js
// Lazy-require the actual scraper (which depends on Puppeteer) so this
// service can be required/loaded without Puppeteer being installed.
const { MongoClient } = require("mongodb");

// Load MONGO_URI and DB_NAME from environment variables or a config file
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "scholarData";
const PUBLICATIONS_COLLECTION = "publications"; // Should match your Publication model's collection

async function runScrapeAndStoreService(scholarUrl, assignedUserId) {
  if (!scholarUrl) {
    console.error("Scraping attempted without a scholarUrl.");
    return { success: false, message: "Scholar URL is required for scraping." };
  }
  console.log(
    `Scraper Service: Starting scrape for User ID ${assignedUserId} from URL: ${scholarUrl}`
  );
  let mongoClient;

  try {
    // Require the scraper here so Puppeteer is only loaded when scraping is executed.
    let profileData;
    try {
      const { scrapeScholarProfile } = require("./scrapers/googleScholarScraper");
      profileData = await scrapeScholarProfile(scholarUrl);
    } catch (err) {
      console.error("runScrapeAndStoreService: failed to load scraper (deferred require):", err);
      return { success: false, message: "Failed to load scraper: " + err.message };
    }

    if (
      profileData &&
      profileData.name &&
      profileData.publications &&
      profileData.publications.length > 0
    ) {
      const documentsToInsert = profileData.publications.map((pub) => ({
        prof_name: profileData.name,
        user_id: assignedUserId,
        paper_title: pub.title,
        paper_journal: pub.journal,
        paper_year: pub.year,
        paper_authors: pub.authors,
        paper_citations: pub.citations,
        // citationCount: pub.citationCount,
        // hIndex: pub.hIndex,
        // i10Index: pub.i10Index,
      }));

      mongoClient = new MongoClient(MONGO_URI);
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const collection = db.collection(PUBLICATIONS_COLLECTION);

      // Optional: Clear old publications for this user_id before inserting new ones to "refresh"
      // This ensures that deleted publications on Scholar are removed from your DB.
      // Be cautious with this in production; consider user expectations.
      await collection.deleteMany({ user_id: assignedUserId });
      console.log(
        `Scraper Service: Cleared old publications for User ID ${assignedUserId}.`
      );

      const insertResult = await collection.insertMany(documentsToInsert, {
        ordered: false,
      });
      console.log(
        `Scraper Service: ${insertResult.insertedCount} new publications inserted for User ID ${assignedUserId}.`
      );
      return {
        success: true,
        insertedCount: insertResult.insertedCount,
        name: profileData.name,
      };
    } else if (profileData) {
      console.log(
        `Scraper Service: Scraped for ${
          profileData.name || "Unknown Name"
        }, but no publications found or extracted for User ID ${assignedUserId}.`
      );
      // Even if no publications, clear old ones if that's the desired behavior
      mongoClient = new MongoClient(MONGO_URI);
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const collection = db.collection(PUBLICATIONS_COLLECTION);
      await collection.deleteMany({ user_id: assignedUserId });
      console.log(
        `Scraper Service: Cleared old publications as no new ones were found for User ID ${assignedUserId}.`
      );
      return {
        success: true,
        insertedCount: 0,
        name: profileData.name,
        message: "No publications found on profile.",
      };
    } else {
      console.log(
        `Scraper Service: Scraping failed for User ID ${assignedUserId}. No profile data retrieved.`
      );
      return { success: false, message: "Scraping profile data failed." };
    }
  } catch (error) {
    console.error(
      `Scraper Service: Error during scrape/store for User ID ${assignedUserId} from ${scholarUrl}:`,
      error
    );
    return { success: false, message: error.message };
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

module.exports = { runScrapeAndStoreService };
