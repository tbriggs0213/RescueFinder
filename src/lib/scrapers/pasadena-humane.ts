// Pasadena Humane Scraper
// Source: https://pasadenahumane.org/adopt/
// Platform: Custom (possibly Petstablished or similar)

import * as cheerio from "cheerio";
import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";

const BASE_URL = "https://pasadenahumane.org";
const ADOPT_URL = "https://pasadenahumane.org/adopt/";

async function scrapePasadenaHumane(): Promise<ScrapedPet[]> {
  const pets: ScrapedPet[] = [];
  
  try {
    const response = await fetch(ADOPT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Pasadena Humane: ${response.status}`);
      return pets;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for pet listings - Pasadena Humane may use various class names
    const petSelectors = [
      ".pet-card",
      ".animal-card", 
      ".adoptable-pet",
      ".pet-listing",
      ".pet-item",
      "[data-pet-id]",
      ".grid-item",
      "article.pet",
    ];

    $(petSelectors.join(", ")).each((_, element) => {
      const $el = $(element);
      
      const name = $el.find(".pet-name, .name, h2, h3, h4").first().text().trim();
      if (!name) return;

      const species = $el.find(".species, .pet-type, .animal-type").text().trim();
      const breed = $el.find(".breed, .pet-breed").text().trim();
      const age = $el.find(".age, .pet-age").text().trim();
      const gender = $el.find(".gender, .pet-gender, .sex").text().trim();
      const size = $el.find(".size, .pet-size").text().trim();
      const description = $el.find(".description, .bio, .pet-bio").text().trim();
      
      const img = $el.find("img").first();
      const photoUrl = img.attr("src") || img.attr("data-src") || "";
      
      const link = $el.find("a").first().attr("href") || "";
      const fullLink = link.startsWith("http") ? link : `${BASE_URL}${link}`;
      
      const idMatch = link.match(/[\/=](\d+)/);
      const externalId = idMatch ? idMatch[1] : `ph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const pet: ScrapedPet = {
        externalId,
        name,
        species: normalizeSpeciesFromText(species || name),
        breed: breed || "Unknown",
        age: normalizeAge(age),
        gender: normalizeGender(gender),
        size: normalizeSize(size),
        description,
        photos: photoUrl ? [normalizePhotoUrl(photoUrl)] : [],
        adoptionUrl: fullLink,
      };

      pets.push(pet);
    });

    // Also check for embedded widget or iframe
    const iframeSrc = $("iframe[src*='adopt'], iframe[src*='pet']").attr("src");
    if (iframeSrc && pets.length === 0) {
      // Try to fetch from the iframe source
      const iframePets = await scrapeIframeSource(iframeSrc);
      pets.push(...iframePets);
    }

    // Check for any embedded JSON
    $("script").each((_, script) => {
      const content = $(script).html() || "";
      
      // Look for pet arrays in JavaScript
      const patterns = [
        /pets\s*[:=]\s*(\[[\s\S]*?\])/,
        /animals\s*[:=]\s*(\[[\s\S]*?\])/,
        /adoptables\s*[:=]\s*(\[[\s\S]*?\])/,
        /"pets"\s*:\s*(\[[\s\S]*?\])/,
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const jsonPets = JSON.parse(match[1]);
            for (const p of jsonPets) {
              if (p.name && !pets.find(existing => existing.name === p.name)) {
                pets.push(convertJsonPet(p));
              }
            }
          } catch {
            // JSON parse failed, continue
          }
        }
      }
    });
  } catch (error) {
    console.error("Error scraping Pasadena Humane:", error);
  }

  return pets;
}

async function scrapeIframeSource(url: string): Promise<ScrapedPet[]> {
  const pets: ScrapedPet[] = [];
  
  try {
    const fullUrl = url.startsWith("http") ? url : `https:${url}`;
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return pets;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse the iframe content similarly
    $(".pet, .animal, [data-animal]").each((_, element) => {
      const $el = $(element);
      const name = $el.find(".name, h2, h3").first().text().trim();
      if (!name) return;

      pets.push({
        externalId: $el.attr("data-id") || `ph-iframe-${Date.now()}`,
        name,
        species: normalizeSpeciesFromText($el.find(".species").text()),
        breed: $el.find(".breed").text().trim() || "Unknown",
        age: normalizeAge($el.find(".age").text()),
        gender: normalizeGender($el.find(".gender").text()),
        size: normalizeSize($el.find(".size").text()),
        photos: [],
        adoptionUrl: url,
      });
    });
  } catch {
    // Silently fail
  }

  return pets;
}

function convertJsonPet(p: any): ScrapedPet {
  return {
    externalId: p.id?.toString() || `ph-${Date.now()}`,
    name: p.name || "Unknown",
    species: normalizeSpeciesFromText(p.species || p.type || ""),
    breed: p.breed || p.primary_breed || "Unknown",
    breedSecondary: p.secondary_breed,
    age: normalizeAge(p.age || "Adult"),
    gender: normalizeGender(p.gender || p.sex || "Unknown"),
    size: normalizeSize(p.size || "Medium"),
    description: p.description || p.bio,
    color: p.color,
    photos: extractPhotosFromJson(p),
    adoptionUrl: p.url || p.link,
    spayedNeutered: p.spayed_neutered || p.fixed,
    houseTrained: p.house_trained,
    shotsCurrent: p.shots_current,
    goodWithChildren: p.good_with_children,
    goodWithDogs: p.good_with_dogs,
    goodWithCats: p.good_with_cats,
  };
}

function extractPhotosFromJson(p: any): string[] {
  const photos: string[] = [];
  if (p.photo) photos.push(p.photo);
  if (p.image) photos.push(p.image);
  if (p.photos && Array.isArray(p.photos)) {
    for (const photo of p.photos) {
      if (typeof photo === "string") photos.push(photo);
      else if (photo.url) photos.push(photo.url);
      else if (photo.large) photos.push(photo.large);
    }
  }
  return photos.map(normalizePhotoUrl);
}

function normalizePhotoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return url;
}

function normalizeSpeciesFromText(text: string): "Dog" | "Cat" | "Rabbit" | "Bird" | "Other" {
  const lower = text.toLowerCase();
  if (lower.includes("dog") || lower.includes("puppy") || lower.includes("canine")) return "Dog";
  if (lower.includes("cat") || lower.includes("kitten") || lower.includes("feline")) return "Cat";
  if (lower.includes("rabbit") || lower.includes("bunny")) return "Rabbit";
  if (lower.includes("bird") || lower.includes("parrot")) return "Bird";
  return "Other";
}

export const pasadenaHumaneScraper: Scraper = {
  name: "Pasadena Humane",
  
  async scrape(): Promise<ScrapeResult[]> {
    const startTime = Date.now();
    
    const pets = await scrapePasadenaHumane();

    return [{
      success: true,
      shelterId: "pasadena-humane",
      shelterName: "Pasadena Humane",
      pets,
      duration: Date.now() - startTime,
    }];
  },
};

