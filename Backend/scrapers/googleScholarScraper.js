const puppeteer = require("puppeteer");

const scrapeScholarProfile = async (url) => {
  console.log(`Launching browser and navigating to ${url}...`);
  // Add { args: ['--no-sandbox', '--disable-setuid-sandbox'] } if running in certain environments (like Docker)
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Increase timeout and try 'networkidle0' for potentially slower loads or complex pages
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    console.log("Page loaded. Evaluating content...");

    const data = await page.evaluate(() => {
      // Helper for top-level elements (name, affiliation) - still uses document
      const getTextFromDocument = (selector) =>
        document.querySelector(selector)?.textContent?.trim() || "";
      // Helper for stats table
      const getStat = (index) =>
        document.querySelectorAll("#gsc_rsb_st .gsc_rsb_std")[index]
          ?.textContent || "0";

      // Use the document-level helper here
      const name = getTextFromDocument("#gsc_prf_in");
      const affiliation = getTextFromDocument("#gsc_prf_ivh div.gsc_prf_il");

      const citationCount = getStat(0);
      const hIndex = getStat(1);
      const i10Index = getStat(2);

      const publications = [];
      // Target the publications table body specifically
      document.querySelectorAll("#gsc_a_b .gsc_a_tr").forEach((pubRow) => {
        // --- FIX STARTS HERE ---
        // Query *within* the current pubRow element, not the whole document
        const titleElement = pubRow.querySelector(".gsc_a_at");
        const yearElement = pubRow.querySelector(".gsc_a_y .gsc_a_h");
        const authorsElement = pubRow.querySelector(".gsc_a_at + .gs_gray");
        const journalElement = pubRow.querySelector(".gs_gray + .gs_gray");
        const citationElement = pubRow.querySelector(".gsc_a_c");

        // Safely get text content from the found elements
        const title = titleElement?.textContent?.trim() || "";
        const year = yearElement?.textContent?.trim() || "N/A";
        const authors =
          authorsElement?.textContent?.split(",").map((name) => name.trim()) ||
          [];
        const journal = journalElement?.textContent?.trim() || "N/A";
        const citations = citationElement?.textContent?.trim() || "N/A";
        // --- FIX ENDS HERE ---

        // Remove the console.log(pubRow) unless needed for debugging
        // console.log(pubRow);

        if (title) {
          // Only add if a title was actually found
          publications.push({
            title: title,
            year: year,
            authors: authors,
            journal: journal,
            citations: citations,
          });
        } else {
          // Optional: Log if a row was skipped because title was missing
          // console.log("Skipping row, title not found:", pubRow.innerHTML);
        }
      });

      const citationHistory = [];
      const graphYears = document.querySelectorAll(".gsc_md_hist_b .gsc_g_t"); // Years are usually in spans with class gsc_g_t
      const graphBars = document.querySelectorAll(".gsc_md_hist_b .gsc_g_al");

      // Fallback to older selectors if modern ones aren't found or lengths don't match
      graphYears.forEach((yearEl, index) => {
        const year = yearEl.textContent.trim();
        const citations = graphBars[index].textContent.trim(); // The number on top of the bar
        // const barHeightStyle = graphBars[index].style.height; // Could also get the actual height if needed, e.g., "10px"
        if (year && citations) {
          citationHistory.push({
            year: parseInt(year),
            citations: parseInt(citations),
          });
        }
      });

      // Return all the data collected
      return {
        name,
        affiliation,
        citationCount,
        hIndex,
        i10Index,
        publications,
        citationHistory
      };
    });

    console.log(data);

    console.log("Data extraction complete.");
    return data; // Return the scraped data
  } catch (error) {
    console.error("Error during scraping process:", error);
    // Return null or an error object if scraping fails
    return null;
  } finally {
    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");
  }
};

// Export the function so it can be used in other files
module.exports = { scrapeScholarProfile };
