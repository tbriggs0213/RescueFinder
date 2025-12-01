// Best Friends Animal Society - LA Scraper
// Source: https://bestfriends.org/adopt-pet
// Platform: National database with location filtering

import * as cheerio from "cheerio";
import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";

const API_BASE = "https://bestfriends.org";
const LA_LOCATION_ID = "los-angeles"; // May need to be determined dynamically

interface BestFriendsAnimal {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  size: string;
  photo: string;
  url: string;
  description?: string;
  attributes?: Record<string, boolean>;
}

async function scrapeBestFriendsLA(): Promise<ScrapedPet[]> {
  const pets: ScrapedPet[] = [];
  
  try {
    // Best Friends has a search API - try to use it
    // First, get the main adoption page to find the API endpoint
    const pageResponse = await fetch("https://bestfriends.org/adopt-pet?location=los-angeles", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!pageResponse.ok) {
      console.error(`Failed to fetch Best Friends page: ${pageResponse.status}`);
      return pets;
    }

    const html = await pageResponse.text();
    const $ = cheerio.load(html);

    // Look for pet cards in the HTML
    $(".pet-card, .animal-card, .adoptable-animal, [data-animal-id]").each((_, element) => {
      const $el = $(element);
      
      const name = $el.find(".pet-name, .name, h2, h3").first().text().trim();
      if (!name) return;

      const species = $el.find(".species, .pet-type").text().trim();
      const breed = $el.find(".breed, .pet-breed").text().trim();
      const age = $el.find(".age, .pet-age").text().trim();
      const gender = $el.find(".gender, .sex").text().trim();
      const size = $el.find(".size").text().trim();
      const description = $el.find(".description, .bio").text().trim();
      
      const img = $el.find("img").first();
      const photoUrl = img.attr("src") || img.attr("data-src") || "";
      
      const link = $el.find("a").first().attr("href") || "";
      
      const idMatch = link.match(/\/(\d+)/) || [$el.attr("data-animal-id")];
      const externalId = idMatch ? idMatch[1] || idMatch[0] : `bf-${Date.now()}`;

      const pet: ScrapedPet = {
        externalId: externalId || `bf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        species: normalizeSpecies(species),
        breed: breed || "Mixed",
        age: normalizeAge(age),
        gender: normalizeGender(gender),
        size: normalizeSize(size),
        description,
        photos: photoUrl ? [normalizeUrl(photoUrl)] : [],
        adoptionUrl: normalizeUrl(link),
      };

      pets.push(pet);
    });

    // Check for embedded JSON data or API calls
    $("script").each((_, script) => {
      const content = $(script).html() || "";
      
      // Look for React/Vue data or API responses
      const dataMatch = content.match(/window\.__(?:NUXT__|NEXT_DATA__|INITIAL_STATE__)\s*=\s*({[\s\S]*?});?(?:<\/script>|$)/);
      if (dataMatch) {
        try {
          const data = JSON.parse(dataMatch[1]);
          const animals = findAnimalsInData(data);
          for (const animal of animals) {
            if (!pets.find(p => p.name === animal.name)) {
              pets.push(animal);
            }
          }
        } catch {
          // JSON parse failed
        }
      }

      // Look for animal arrays
      const arrayMatch = content.match(/(?:animals|pets|adoptables)\s*[:=]\s*(\[[\s\S]*?\])/);
      if (arrayMatch) {
        try {
          const animalsArray = JSON.parse(arrayMatch[1]);
          for (const a of animalsArray) {
            if (a.name && !pets.find(p => p.name === a.name)) {
              pets.push(convertToScrapedPet(a));
            }
          }
        } catch {
          // JSON parse failed
        }
      }
    });

    // Also try to fetch from their API if we can find the endpoint
    const apiPets = await tryBestFriendsApi();
    for (const pet of apiPets) {
      if (!pets.find(p => p.externalId === pet.externalId)) {
        pets.push(pet);
      }
    }
  } catch (error) {
    console.error("Error scraping Best Friends LA:", error);
  }

  return pets;
}

async function tryBestFriendsApi(): Promise<ScrapedPet[]> {
  const pets: ScrapedPet[] = [];
  
  // Try common API patterns
  const apiEndpoints = [
    "https://bestfriends.org/api/v1/animals?location=los-angeles",
    "https://bestfriends.org/api/animals?center=los-angeles",
    "https://bestfriends.org/adopt/api/search?location=los-angeles",
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.animals && Array.isArray(data.animals)) {
          for (const a of data.animals) {
            pets.push(convertToScrapedPet(a));
          }
          break; // Found working endpoint
        }
        if (Array.isArray(data)) {
          for (const a of data) {
            pets.push(convertToScrapedPet(a));
          }
          break;
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return pets;
}

function findAnimalsInData(data: any, path: string = ""): ScrapedPet[] {
  const animals: ScrapedPet[] = [];
  
  if (!data || typeof data !== "object") return animals;

  // Check if this looks like an animal object
  if (data.name && (data.species || data.type || data.breed)) {
    animals.push(convertToScrapedPet(data));
    return animals;
  }

  // Check for arrays of animals
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.name && (item.species || item.type || item.breed)) {
        animals.push(convertToScrapedPet(item));
      }
    }
  }

  // Recursively search object properties
  for (const key of Object.keys(data)) {
    if (["animals", "pets", "adoptables", "results", "data"].includes(key.toLowerCase())) {
      animals.push(...findAnimalsInData(data[key], `${path}.${key}`));
    }
  }

  return animals;
}

function convertToScrapedPet(a: any): ScrapedPet {
  const photos: string[] = [];
  if (a.photo) photos.push(normalizeUrl(a.photo));
  if (a.image) photos.push(normalizeUrl(a.image));
  if (a.photos && Array.isArray(a.photos)) {
    for (const p of a.photos) {
      if (typeof p === "string") photos.push(normalizeUrl(p));
      else if (p.url) photos.push(normalizeUrl(p.url));
      else if (p.large) photos.push(normalizeUrl(p.large));
    }
  }

  return {
    externalId: a.id?.toString() || a.animal_id?.toString() || `bf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: a.name || "Unknown",
    species: normalizeSpecies(a.species || a.type || ""),
    breed: a.breed || a.primary_breed || "Mixed",
    breedSecondary: a.secondary_breed,
    age: normalizeAge(a.age || "Adult"),
    gender: normalizeGender(a.sex || a.gender || "Unknown"),
    size: normalizeSize(a.size || "Medium"),
    description: a.description || a.bio,
    color: a.color,
    photos,
    adoptionUrl: normalizeUrl(a.url || a.link || ""),
    spayedNeutered: a.spayed_neutered || a.fixed,
    houseTrained: a.house_trained,
    shotsCurrent: a.shots_current,
    goodWithChildren: a.good_with_kids || a.good_with_children,
    goodWithDogs: a.good_with_dogs,
    goodWithCats: a.good_with_cats,
  };
}

function normalizeSpecies(species: string): "Dog" | "Cat" | "Rabbit" | "Bird" | "Other" {
  const lower = species.toLowerCase();
  if (lower.includes("dog") || lower.includes("puppy")) return "Dog";
  if (lower.includes("cat") || lower.includes("kitten")) return "Cat";
  if (lower.includes("rabbit") || lower.includes("bunny")) return "Rabbit";
  if (lower.includes("bird")) return "Bird";
  return "Other";
}

function normalizeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

export const bestFriendsScraper: Scraper = {
  name: "Best Friends Animal Society - LA",
  
  async scrape(): Promise<ScrapeResult[]> {
    const startTime = Date.now();
    
    const pets = await scrapeBestFriendsLA();

    return [{
      success: true,
      shelterId: "best-friends-la",
      shelterName: "Best Friends Lifesaving Center - Los Angeles",
      pets,
      duration: Date.now() - startTime,
    }];
  },
};

