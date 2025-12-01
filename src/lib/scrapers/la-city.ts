// LA City Animal Services Scraper
// Source: https://www.laanimalservices.com/adopt/
// Platform: Custom system, may use embedded widgets

import * as cheerio from "cheerio";
import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";
import { getSheltersByScraperKey } from "../shelters";

const ADOPT_URL = "https://www.laanimalservices.com/adopt/";

// LA City shelter location codes
const SHELTER_LOCATIONS: Record<string, string> = {
  "la-city-east-valley": "East Valley",
  "la-city-west-valley": "West Valley",
  "la-city-west-la": "West LA",
  "la-city-north-central": "North Central",
  "la-city-south-la": "South LA",
  "la-city-harbor": "Harbor",
};

async function scrapeLACityAnimals(): Promise<Map<string, ScrapedPet[]>> {
  const shelterPets = new Map<string, ScrapedPet[]>();
  
  try {
    // First, get the main adoption page
    const response = await fetch(ADOPT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch LA City page: ${response.status}`);
      return shelterPets;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for embedded pet data or API endpoints
    // LA City often uses iframes or JavaScript widgets

    // Try to find pet listing elements
    $(".pet-listing, .animal-card, .adoptable-pet, [data-pet-id]").each((_, element) => {
      const $el = $(element);
      
      const externalId = $el.attr("data-pet-id") || $el.attr("data-id") || `laas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const name = $el.find(".pet-name, .name, h3, h4").first().text().trim();
      const species = $el.find(".species, .pet-type").text().trim() || "Dog";
      const breed = $el.find(".breed, .pet-breed").text().trim();
      const age = $el.find(".age, .pet-age").text().trim();
      const gender = $el.find(".gender, .pet-gender").text().trim();
      const size = $el.find(".size, .pet-size").text().trim();
      const location = $el.find(".location, .shelter-name, .shelter").text().trim();
      const photoUrl = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";
      const description = $el.find(".description, .bio, .pet-bio").text().trim();
      const adoptionUrl = $el.find("a.adopt-link, a.view-details").attr("href") || "";

      if (!name) return;

      // Determine which shelter this pet belongs to
      const shelterSlug = mapLocationToSlug(location);
      
      const pet: ScrapedPet = {
        externalId,
        name,
        species: species.toLowerCase().includes("cat") ? "Cat" : "Dog",
        breed: breed || "Mixed Breed",
        age: normalizeAge(age),
        gender: normalizeGender(gender),
        size: normalizeSize(size),
        description,
        photos: photoUrl ? [photoUrl] : [],
        adoptionUrl: adoptionUrl.startsWith("http") ? adoptionUrl : `https://www.laanimalservices.com${adoptionUrl}`,
      };

      if (!shelterPets.has(shelterSlug)) {
        shelterPets.set(shelterSlug, []);
      }
      shelterPets.get(shelterSlug)!.push(pet);
    });

    // Also check for any embedded JSON data
    $("script").each((_, script) => {
      const scriptContent = $(script).html() || "";
      
      // Look for pet data in JavaScript
      const dataMatch = scriptContent.match(/(?:pets|animals|adoptables)\s*[:=]\s*(\[[\s\S]*?\])/);
      if (dataMatch) {
        try {
          const petsData = JSON.parse(dataMatch[1]);
          processPetsJson(petsData, shelterPets);
        } catch {
          // Not valid JSON, continue
        }
      }
    });
  } catch (error) {
    console.error("Error scraping LA City Animals:", error);
  }

  return shelterPets;
}

function processPetsJson(petsData: any[], shelterPets: Map<string, ScrapedPet[]>) {
  for (const pet of petsData) {
    if (!pet.name) continue;

    const shelterSlug = mapLocationToSlug(pet.location || pet.shelter || "");
    
    const scrapedPet: ScrapedPet = {
      externalId: pet.id?.toString() || pet.animal_id?.toString() || `laas-${Date.now()}`,
      name: pet.name,
      species: pet.species?.toLowerCase().includes("cat") ? "Cat" : "Dog",
      breed: pet.breed || pet.primary_breed || "Mixed Breed",
      breedSecondary: pet.secondary_breed,
      age: normalizeAge(pet.age || "Adult"),
      gender: normalizeGender(pet.gender || pet.sex || "Unknown"),
      size: normalizeSize(pet.size || "Medium"),
      description: pet.description || pet.bio,
      color: pet.color,
      photos: extractPhotos(pet),
      adoptionUrl: pet.url || pet.link,
      spayedNeutered: pet.spayed_neutered || pet.altered,
      houseTrained: pet.house_trained,
      shotsCurrent: pet.shots_current || pet.vaccinated,
      goodWithChildren: pet.good_with_children || pet.kids,
      goodWithDogs: pet.good_with_dogs || pet.dogs,
      goodWithCats: pet.good_with_cats || pet.cats,
    };

    if (!shelterPets.has(shelterSlug)) {
      shelterPets.set(shelterSlug, []);
    }
    shelterPets.get(shelterSlug)!.push(scrapedPet);
  }
}

function extractPhotos(pet: any): string[] {
  const photos: string[] = [];
  
  if (pet.photo) photos.push(pet.photo);
  if (pet.photos && Array.isArray(pet.photos)) {
    for (const p of pet.photos) {
      if (typeof p === "string") photos.push(p);
      else if (p.url) photos.push(p.url);
      else if (p.large) photos.push(p.large);
      else if (p.medium) photos.push(p.medium);
    }
  }
  if (pet.image) photos.push(pet.image);
  if (pet.images && Array.isArray(pet.images)) {
    photos.push(...pet.images);
  }
  
  return photos;
}

function mapLocationToSlug(location: string): string {
  const lower = location.toLowerCase();
  if (lower.includes("east valley")) return "la-city-east-valley";
  if (lower.includes("west valley")) return "la-city-west-valley";
  if (lower.includes("west la")) return "la-city-west-la";
  if (lower.includes("north central")) return "la-city-north-central";
  if (lower.includes("south la") || lower.includes("south los angeles")) return "la-city-south-la";
  if (lower.includes("harbor")) return "la-city-harbor";
  return "la-city-unknown";
}

export const laCityScraper: Scraper = {
  name: "LA City Animal Services",
  
  async scrape(shelterSlug?: string): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const shelters = getSheltersByScraperKey("la-city");
    const startTime = Date.now();

    // Scrape all LA City shelters at once
    const allPets = await scrapeLACityAnimals();

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

