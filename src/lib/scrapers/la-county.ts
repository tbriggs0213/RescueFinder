// LA County Animal Care Centers Scraper
// Source: https://animalcare.lacounty.gov/dacc-search/
// Uses direct API calls (no Puppeteer needed for Render compatibility)

import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";
import { getSheltersByScraperKey } from "../shelters";

const API_URL = "https://animalcare.lacounty.gov/wp-json/wppro-acc/v1/get/animals";
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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function scrapeDirectAPI(): Promise<Map<string, ScrapedPet[]>> {
  const shelterPets = new Map<string, ScrapedPet[]>();
  
  // Initialize all shelter slugs with empty arrays
  const shelters = getSheltersByScraperKey("la-county");
  for (const shelter of shelters) {
    shelterPets.set(shelter.slug, []);
  }

  let allAnimals: any[] = [];

  try {
    console.log("Attempting direct API call to LA County...");
    
    // Try the direct API endpoint with various parameters
    const apiUrls = [
      `${API_URL}?PageNumber=1&PageSize=500`,
      `${API_URL}?page=1&per_page=500`,
      `${API_URL}`,
      "https://animalcare.lacounty.gov/wp-json/wp/v2/animal?per_page=100",
      "https://animalcare.lacounty.gov/wp-json/wppro-acc/v1/animals",
    ];

    for (const apiUrl of apiUrls) {
      try {
        console.log(`Trying: ${apiUrl}`);
        
        const response = await fetchWithTimeout(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://animalcare.lacounty.gov/dacc-search/",
          },
        }, 15000);

        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Data type: ${typeof data}, isArray: ${Array.isArray(data)}`);
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Found ${data.length} animals from ${apiUrl}`);
            allAnimals = data;
            break;
          } else if (data && typeof data === "object") {
            // Check for nested data
            const possibleArrays = [data.animals, data.data, data.results, data.items];
            for (const arr of possibleArrays) {
              if (Array.isArray(arr) && arr.length > 0) {
                console.log(`Found ${arr.length} animals in nested array`);
                allAnimals = arr;
                break;
              }
            }
            if (allAnimals.length > 0) break;
          }
        }
      } catch (e) {
        console.log(`Failed: ${apiUrl} - ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    // If direct API didn't work, try scraping the HTML page with fetch + cheerio
    if (allAnimals.length === 0) {
      console.log("Direct API failed, trying HTML scrape with cheerio...");
      
      try {
        const cheerio = await import("cheerio");
        
        // Fetch the search page
        const pageResponse = await fetchWithTimeout(
          "https://animalcare.lacounty.gov/dacc-search/?PageNumber=1&PageSize=100",
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/html",
            },
          },
          30000
        );

        if (pageResponse.ok) {
          const html = await pageResponse.text();
          const $ = cheerio.load(html);
          
          console.log(`HTML page loaded, size: ${html.length}`);
          
          // Look for pet cards
          $(".card.custom-card, .animal-card, [class*='pet']").each((_, card) => {
            const $card = $(card);
            
            // Extract data from heart button (has data attributes)
            const $heartBtn = $card.find("[data-id]");
            const animalId = $heartBtn.attr("data-id") || "";
            const animalName = $heartBtn.attr("data-name") || "";
            const imageName = $heartBtn.attr("data-image") || "";
            
            // Get image
            const imgSrc = $card.find("img").attr("src") || "";
            
            if (animalId) {
              allAnimals.push({
                animalId: animalId,
                animalName: animalName || `Pet ${animalId}`,
                image: imageName || imgSrc,
                // Default values since we can't get full data from HTML
                animalType: "DOG",
                breed: "Mixed Breed",
                sex: "Unknown",
                location: "Downey",
                imageCount: 1,
              });
            }
          });
          
          console.log(`Cheerio found ${allAnimals.length} animals from HTML`);
          
          // Also check for inline JSON data
          const scriptContent = html.match(/var\s+animalsData\s*=\s*(\[[\s\S]*?\]);/);
          if (scriptContent) {
            try {
              const jsonData = JSON.parse(scriptContent[1]);
              if (Array.isArray(jsonData) && jsonData.length > allAnimals.length) {
                console.log(`Found ${jsonData.length} animals in inline script`);
                allAnimals = jsonData;
              }
            } catch (e) {
              console.log("Could not parse inline JSON");
            }
          }
        }
      } catch (e) {
        console.error("Cheerio scrape error:", e);
      }
    }

  } catch (error) {
    console.error("LA County scraper error:", error);
  }

  console.log(`Total animals collected: ${allAnimals.length}`);

  // Process animals
  if (allAnimals.length > 0) {
    console.log("Sample animal data:", JSON.stringify(allAnimals[0], null, 2));
    
    for (const animal of allAnimals) {
      try {
        const animalId = animal.animalId || animal.AnimalId || animal.AnimalID || animal.id || `lac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = animal.animalName || animal.Name || animal.name || `Pet ${animalId}`;
        const type = animal.animalType || animal.Type || animal.type || "DOG";
        const species = type.toUpperCase().includes("CAT") ? "Cat" : "Dog";
        const breed = animal.breed || animal.Breed || "Mixed Breed";
        
        // Calculate age
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
        
        const gender = animal.sex || animal.Sex || animal.gender || "Unknown";
        const size = animal.animalSize || animal.Size || animal.size || "Medium";
        const location = animal.location || animal.Location || "";
        
        // Photo URL
        const photos: string[] = [];
        if (animal.imageCount > 0 || animal.image) {
          photos.push(`${IMAGE_BASE}${animalId}.jpg`);
        }
        
        const shelterSlug = mapLocationToSlug(location);
        
        const pet: ScrapedPet = {
          externalId: String(animalId),
          name: name,
          species: species,
          breed: breed,
          age: normalizeAge(age),
          gender: normalizeGender(gender),
          size: normalizeSize(size),
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

    console.log("=== Starting LA County scraper (no Puppeteer) ===");

    const allPets = await scrapeDirectAPI();

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
