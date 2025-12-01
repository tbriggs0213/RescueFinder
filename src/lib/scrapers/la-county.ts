// LA County Animal Care Centers Scraper
// Source: https://animalcare.lacounty.gov/dacc-search/
// Uses Browserless.io for cloud browser (works on Render free tier)

import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";
import { getSheltersByScraperKey } from "../shelters";

const SEARCH_URL = "https://animalcare.lacounty.gov/dacc-search/";
const IMAGE_BASE = "https://daccanimalimagesprod.blob.core.windows.net/images/";

// Map location names to shelter slugs
const LOCATION_TO_SLUG: Record<string, string> = {
  "agoura": "la-county-agoura",
  "baldwin park": "la-county-baldwin-park",
  "baldwin": "la-county-baldwin-park",
  "carson": "la-county-carson",
  "gardena": "la-county-carson",
  "castaic": "la-county-castaic",
  "downey": "la-county-downey",
  "lancaster": "la-county-lancaster",
  "palmdale": "la-county-lancaster",
};

function mapLocationToSlug(location: string): string {
  if (!location) return "la-county-downey";
  const lower = location.toLowerCase().trim();
  for (const [key, slug] of Object.entries(LOCATION_TO_SLUG)) {
    if (lower.includes(key)) return slug;
  }
  return "la-county-downey";
}

async function scrapeWithBrowserless(): Promise<Map<string, ScrapedPet[]>> {
  const shelterPets = new Map<string, ScrapedPet[]>();
  
  // Initialize all shelter slugs with empty arrays
  const shelters = getSheltersByScraperKey("la-county");
  for (const shelter of shelters) {
    shelterPets.set(shelter.slug, []);
  }

  let allAnimals: any[] = [];

  // Check for Browserless API key
  const browserlessToken = process.env.BROWSERLESS_API_KEY;
  
  if (!browserlessToken) {
    console.log("No BROWSERLESS_API_KEY found, trying local Puppeteer...");
    return scrapeWithLocalPuppeteer(shelterPets);
  }

  try {
    const puppeteer = await import("puppeteer-core");
    
    console.log("Connecting to Browserless.io...");
    
    // Connect to Browserless cloud browser
    const browser = await puppeteer.default.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });

    console.log("Connected to Browserless!");

    const page = await browser.newPage();
    
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Intercept API responses
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/wp-json/wppro-acc/v1/get/animals")) {
        try {
          const data = await response.json();
          console.log(`Intercepted API response: ${url.substring(0, 80)}...`);
          
          if (Array.isArray(data)) {
            console.log(`Found ${data.length} animals in API response`);
            allAnimals.push(...data);
          } else if (data && typeof data === "object") {
            if (data.animals) allAnimals.push(...data.animals);
            else if (data.data) allAnimals.push(...data.data);
            else if (data.results) allAnimals.push(...data.results);
          }
        } catch (e) {
          // Not JSON or error parsing
        }
      }
    });

    // Load the search page - use shorter timeout for Browserless free tier
    console.log("Loading LA County search page...");
    await page.goto(`${SEARCH_URL}?PageNumber=1&SortType=0&PageSize=100`, {
      waitUntil: "networkidle2",
      timeout: 45000, // 45 seconds to stay under 1 min limit
    });

    // Brief wait for API calls
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`After first page: ${allAnimals.length} animals intercepted`);

    // If we got animals from first page, that's enough for free tier
    // (Can't do pagination due to 1-minute limit)

    // If no API interception worked, try HTML scraping
    if (allAnimals.length === 0) {
      console.log("No API data intercepted, trying HTML scraping...");
      
      const htmlAnimals = await page.evaluate(() => {
        const animals: any[] = [];
        const cards = document.querySelectorAll(".card.custom-card, .animal-card, [class*='pet-card'], .animal-item");
        
        cards.forEach((card) => {
          const heartBtn = card.querySelector("[data-id]");
          const animalId = heartBtn?.getAttribute("data-id") || "";
          const animalName = heartBtn?.getAttribute("data-name") || "";
          const imageName = heartBtn?.getAttribute("data-image") || "";
          
          const img = card.querySelector("img");
          const imgSrc = img?.getAttribute("src") || "";
          
          if (animalId) {
            animals.push({
              animalId: animalId,
              animalName: animalName || `Pet ${animalId}`,
              image: imageName || imgSrc,
              animalType: "DOG",
              breed: "Mixed Breed",
              sex: "Unknown",
              location: "",
              imageCount: 1,
            });
          }
        });
        
        return animals;
      });

      console.log(`HTML scraping found ${htmlAnimals.length} animals`);
      allAnimals = htmlAnimals;
    }

    await browser.close();
    console.log("Browserless session closed");
    
  } catch (error) {
    console.error("Browserless error:", error);
    // Fall back to direct API attempt
    return scrapeDirectAPI(shelterPets);
  }

  return processAnimals(allAnimals, shelterPets);
}

// Fallback: try local Puppeteer (for localhost dev)
async function scrapeWithLocalPuppeteer(shelterPets: Map<string, ScrapedPet[]>): Promise<Map<string, ScrapedPet[]>> {
  let allAnimals: any[] = [];

  try {
    const puppeteer = await import("puppeteer");
    
    console.log("Launching local Puppeteer...");
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/wp-json/wppro-acc/v1/get/animals")) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            allAnimals.push(...data);
          } else if (data?.animals) {
            allAnimals.push(...data.animals);
          }
        } catch (e) {}
      }
    });

    await page.goto(`${SEARCH_URL}?PageNumber=1&SortType=0&PageSize=100`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Paginate to get more animals
    let pageNum = 2;
    let previousCount = allAnimals.length;
    
    while (pageNum <= 10 && allAnimals.length > 0) {
      await page.goto(`${SEARCH_URL}?PageNumber=${pageNum}&SortType=0&PageSize=100`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (allAnimals.length === previousCount) break;
      previousCount = allAnimals.length;
      pageNum++;
    }

    await browser.close();
    
  } catch (error) {
    console.error("Local Puppeteer error:", error);
    return scrapeDirectAPI(shelterPets);
  }

  return processAnimals(allAnimals, shelterPets);
}

// Last resort: direct API calls
async function scrapeDirectAPI(shelterPets: Map<string, ScrapedPet[]>): Promise<Map<string, ScrapedPet[]>> {
  console.log("Trying direct API calls as last resort...");
  
  // This likely won't work but worth a try
  try {
    const response = await fetch("https://animalcare.lacounty.gov/wp-json/wppro-acc/v1/get/animals", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return processAnimals(data, shelterPets);
      }
    }
  } catch (e) {
    console.log("Direct API failed");
  }
  
  return shelterPets;
}

// Process raw animal data into ScrapedPets
function processAnimals(allAnimals: any[], shelterPets: Map<string, ScrapedPet[]>): Map<string, ScrapedPet[]> {
  console.log(`Processing ${allAnimals.length} animals...`);
  
  if (allAnimals.length > 0) {
    console.log("Sample animal:", JSON.stringify(allAnimals[0], null, 2));
  }

  for (const animal of allAnimals) {
    try {
      const animalId = animal.animalId || animal.AnimalId || animal.id || `lac-${Date.now()}`;
      const name = animal.animalName || animal.Name || animal.name || `Pet ${animalId}`;
      const type = animal.animalType || animal.Type || animal.type || "DOG";
      const species = type.toUpperCase().includes("CAT") ? "Cat" : "Dog";
      const breed = animal.breed || animal.Breed || "Mixed Breed";
      
      let age = "Adult";
      if (animal.yearsOld !== undefined || animal.monthsOld !== undefined) {
        const years = animal.yearsOld || 0;
        const months = animal.monthsOld || 0;
        if (years === 0 && months < 12) age = "Baby";
        else if (years < 2) age = "Young";
        else if (years < 8) age = "Adult";
        else age = "Senior";
      }
      
      const gender = animal.sex || animal.Sex || "Unknown";
      const size = animal.animalSize || animal.Size || "Medium";
      const location = animal.location || animal.Location || "";
      
      const photos: string[] = [];
      if (animal.imageCount > 0 || animal.image) {
        photos.push(`${IMAGE_BASE}${animalId}.jpg`);
      }
      
      const shelterSlug = mapLocationToSlug(location);
      
      const pet: ScrapedPet = {
        externalId: String(animalId),
        name,
        species,
        breed,
        age: normalizeAge(age),
        gender: normalizeGender(gender),
        size: normalizeSize(size),
        description: animal.primaryColor ? `Color: ${animal.primaryColor}` : undefined,
        photos,
        adoptionUrl: `https://animalcare.lacounty.gov/dacc-search/?AnimalID=${animalId}`,
        color: animal.primaryColor,
      };

      if (!shelterPets.has(shelterSlug)) {
        shelterPets.set(shelterSlug, []);
      }
      shelterPets.get(shelterSlug)!.push(pet);
      
    } catch (e) {
      console.error("Error processing animal:", e);
    }
  }

  for (const [slug, pets] of shelterPets.entries()) {
    if (pets.length > 0) {
      console.log(`${slug}: ${pets.length} pets`);
    }
  }

  return shelterPets;
}

export const laCountyScraper: Scraper = {
  name: "LA County Animal Care",

  async scrape(shelterSlug?: string): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const shelters = getSheltersByScraperKey("la-county");
    const startTime = Date.now();

    console.log("=== Starting LA County scraper ===");

    const allPets = await scrapeWithBrowserless();

    const totalPets = Array.from(allPets.values()).reduce((sum, pets) => sum + pets.length, 0);
    console.log(`=== LA County scraper complete: ${totalPets} total pets ===`);

    for (const shelter of shelters) {
      if (shelterSlug && shelter.slug !== shelterSlug) continue;

      const pets = allPets.get(shelter.slug) || [];

      results.push({
        success: true,
        shelterId: shelter.slug,
        shelterName: shelter.name,
        pets,
        duration: Date.now() - startTime,
      });
    }

    return results;
  },
};
