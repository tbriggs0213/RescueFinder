// LA County Animal Care Centers Scraper
// Source: https://animalcare.lacounty.gov/dacc-search/
// Uses Puppeteer to intercept their API responses

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

async function scrapeWithPuppeteer(): Promise<Map<string, ScrapedPet[]>> {
  const shelterPets = new Map<string, ScrapedPet[]>();
  
  // Initialize all shelter slugs with empty arrays
  const shelters = getSheltersByScraperKey("la-county");
  for (const shelter of shelters) {
    shelterPets.set(shelter.slug, []);
  }

  let allAnimals: any[] = [];

  try {
    const puppeteer = await import("puppeteer");
    
    console.log("Launching Puppeteer to intercept LA County API...");
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

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
          console.log(`Response type: ${typeof data}, isArray: ${Array.isArray(data)}`);
          
          if (Array.isArray(data)) {
            console.log(`Found ${data.length} animals in API response`);
            allAnimals.push(...data);
          } else if (data && typeof data === "object") {
            // Log keys to understand structure
            console.log(`Response keys: ${Object.keys(data).slice(0, 10).join(", ")}`);
            
            // Try different possible formats
            if (data.animals) {
              allAnimals.push(...data.animals);
            } else if (data.data) {
              allAnimals.push(...data.data);
            } else if (data.results) {
              allAnimals.push(...data.results);
            } else {
              // Maybe the object itself contains animal data as values
              const values = Object.values(data);
              if (values.length > 0) {
                allAnimals.push(...values);
              }
            }
          }
        } catch (e) {
          // Not JSON or error parsing
        }
      }
    });

    // Load the search page with max page size
    console.log("Loading LA County search page...");
    await page.goto(`${SEARCH_URL}?PageNumber=1&SortType=0&PageSize=100`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check what we got
    console.log(`After first page: ${allAnimals.length} animals intercepted`);

    // If we got animals, try to get more pages
    if (allAnimals.length > 0) {
      // Get total count from page if available
      const totalText = await page.evaluate(() => {
        const el = document.querySelector(".total-count, .results-count, [class*='total']");
        return el?.textContent || "";
      });
      console.log(`Total count text: "${totalText}"`);

      // Navigate through pages to get all animals
      let pageNum = 2;
      let previousCount = allAnimals.length;
      
      while (pageNum <= 20) { // Safety limit
        console.log(`Loading page ${pageNum}...`);
        await page.goto(`${SEARCH_URL}?PageNumber=${pageNum}&SortType=0&PageSize=100`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we got new animals
        if (allAnimals.length === previousCount) {
          console.log(`No new animals on page ${pageNum}, stopping pagination`);
          break;
        }
        
        previousCount = allAnimals.length;
        pageNum++;
      }
    }

    // If no animals from API interception, try scraping HTML directly
    if (allAnimals.length === 0) {
      console.log("No API data intercepted, trying HTML scraping...");
      
      await page.goto(`${SEARCH_URL}?PageNumber=1&SortType=0&PageSize=100`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
      await new Promise(resolve => setTimeout(resolve, 5000));

      const htmlAnimals = await page.evaluate(() => {
        const animals: any[] = [];
        
        // Try various selectors for pet cards
        const cards = document.querySelectorAll(".card.custom-card, .animal-card, [class*='pet-card']");
        console.log(`Found ${cards.length} cards`);
        
        cards.forEach((card) => {
          // Extract data from heart button (has data attributes)
          const heartBtn = card.querySelector("[data-id]");
          const animalId = heartBtn?.getAttribute("data-id") || "";
          const animalName = heartBtn?.getAttribute("data-name") || "";
          const imageName = heartBtn?.getAttribute("data-image") || "";
          
          // Try to get other info from card text
          const cardText = card.textContent || "";
          
          // Extract image
          const img = card.querySelector("img");
          const imgSrc = img?.getAttribute("src") || "";
          
          // Extract link
          const link = card.querySelector("a[href*='animal'], a[href*='pet']");
          const detailUrl = link?.getAttribute("href") || "";
          
          if (animalId) {
            animals.push({
              id: animalId,
              name: animalName,
              image: imageName || imgSrc,
              url: detailUrl,
              text: cardText.substring(0, 500),
            });
          }
        });
        
        return animals;
      });

      console.log(`HTML scraping found ${htmlAnimals.length} animals`);
      
      if (htmlAnimals.length > 0) {
        console.log("Sample HTML animal:", JSON.stringify(htmlAnimals[0], null, 2));
        allAnimals = htmlAnimals;
      }
    }

    await browser.close();
    
  } catch (error) {
    console.error("Puppeteer error:", error);
  }

  console.log(`Total animals collected: ${allAnimals.length}`);

  // Process animals
  if (allAnimals.length > 0) {
    console.log("Sample animal data:", JSON.stringify(allAnimals[0], null, 2));
    
    for (const animal of allAnimals) {
      try {
        // Use the exact field names from the API response
        const animalId = animal.animalId || animal.AnimalId || animal.AnimalID || `lac-${Date.now()}`;
        const name = animal.animalName || animal.Name || animal.name || animalId;
        const type = animal.animalType || animal.Type || animal.type || "DOG";
        const species = type.toUpperCase().includes("CAT") ? "Cat" : "Dog";
        const breed = animal.breed || animal.Breed || "Mixed";
        
        // Calculate age from yearsOld and monthsOld
        let age = "Adult";
        if (animal.yearsOld !== undefined || animal.monthsOld !== undefined) {
          const years = animal.yearsOld || 0;
          const months = animal.monthsOld || 0;
          if (years === 0 && months < 12) {
            age = "Baby";
          } else if (years < 2) {
            age = "Young";
          } else if (years < 8) {
            age = "Adult";
          } else {
            age = "Senior";
          }
        }
        
        const gender = animal.sex || animal.Sex || "Unknown";
        const size = animal.animalSize || animal.Size || "Medium";
        const location = animal.location || animal.Location || "";
        
        // Construct photo URL from animalId
        // Images are at: https://daccanimalimagesprod.blob.core.windows.net/images/{animalId}.jpg
        const photos: string[] = [];
        const imageCount = animal.imageCount || 0;
        if (imageCount > 0) {
          photos.push(`${IMAGE_BASE}${animalId}.jpg`);
        }
        
        const shelterSlug = mapLocationToSlug(location);
        
        const pet: ScrapedPet = {
          externalId: animalId,
          name: name,
          species: species,
          breed: breed,
          age: normalizeAge(age),
          gender: normalizeGender(gender),
          size: normalizeSize(size || "Medium"),
          description: animal.primaryColor ? `Color: ${animal.primaryColor}` : undefined,
          photos: photos,
          adoptionUrl: `https://animalcare.lacounty.gov/dacc-search/?AnimalID=${animalId}`,
          color: animal.primaryColor || undefined,
        };

        if (!shelterPets.has(shelterSlug)) {
          shelterPets.set(shelterSlug, []);
        }
        shelterPets.get(shelterSlug)!.push(pet);
        
      } catch (e) {
        console.error("Error processing animal:", e);
      }
    }
  }

  // Log results
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

    const allPets = await scrapeWithPuppeteer();

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
