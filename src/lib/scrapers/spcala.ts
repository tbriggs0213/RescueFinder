// spcaLA Scraper
// Source: https://spcala.com/adoptable/dogs/ and /cats/
// Platform: Custom CMS

import * as cheerio from "cheerio";
import { Scraper, ScrapedPet, ScrapeResult, normalizeAge, normalizeSize, normalizeGender } from "./types";
import { getSheltersByScraperKey } from "../shelters";

const DOGS_URL = "https://spcala.com/adoptable/dogs/";
const CATS_URL = "https://spcala.com/adoptable/cats/";

interface SPCALAPet {
  name: string;
  breed: string;
  age: string;
  gender: string;
  size?: string;
  color?: string;
  photo: string;
  url: string;
  id: string;
  location?: string;
  description?: string;
}

async function scrapeSPCALAPage(url: string, species: "Dog" | "Cat"): Promise<SPCALAPet[]> {
  const pets: SPCALAPet[] = [];
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch spcaLA ${species} page: ${response.status}`);
      return pets;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // spcaLA uses a grid of pet cards
    $(".pet-card, .adoptable-pet, .animal-listing, article.pet, .pet-item").each((_, element) => {
      const $el = $(element);
      
      // Extract pet details
      const name = $el.find(".pet-name, h2, h3, .name").first().text().trim();
      const breed = $el.find(".breed, .pet-breed").text().trim();
      const age = $el.find(".age, .pet-age").text().trim();
      const gender = $el.find(".gender, .pet-gender, .sex").text().trim();
      const size = $el.find(".size, .pet-size").text().trim();
      const color = $el.find(".color, .pet-color").text().trim();
      const location = $el.find(".location, .shelter-location").text().trim();
      const description = $el.find(".description, .bio, .pet-description").text().trim();
      
      // Get photo
      const img = $el.find("img").first();
      const photo = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
      
      // Get detail link
      const link = $el.find("a").first().attr("href") || "";
      
      // Extract ID from URL or generate one
      const idMatch = link.match(/\/(\d+)\/?$/) || link.match(/pet[_-]?id[=\/](\d+)/i);
      const id = idMatch ? idMatch[1] : `spcala-${species.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!name) return; // Skip if no name

      pets.push({
        id,
        name,
        breed,
        age,
        gender,
        size,
        color,
        photo,
        url: link.startsWith("http") ? link : `https://spcala.com${link}`,
        location,
        description,
      });
    });

    // Also try to find pet data in JSON
    $("script").each((_, script) => {
      const content = $(script).html() || "";
      const jsonMatch = content.match(/(?:var\s+)?(?:pets|animals)\s*=\s*(\[[\s\S]*?\]);/);
      if (jsonMatch) {
        try {
          const jsonPets = JSON.parse(jsonMatch[1]);
          for (const p of jsonPets) {
            if (p.name && !pets.find(existing => existing.name === p.name)) {
              pets.push({
                id: p.id || `spcala-${species.toLowerCase()}-${Date.now()}`,
                name: p.name,
                breed: p.breed || "",
                age: p.age || "",
                gender: p.gender || p.sex || "",
                size: p.size || "",
                color: p.color || "",
                photo: p.photo || p.image || "",
                url: p.url || p.link || "",
                location: p.location || "",
                description: p.description || p.bio || "",
              });
            }
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    });
  } catch (error) {
    console.error(`Error scraping spcaLA ${species}:`, error);
  }

  return pets;
}

async function scrapePetDetails(url: string): Promise<Partial<ScrapedPet>> {
  const details: Partial<ScrapedPet> = {};
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return details;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get additional photos
    const photos: string[] = [];
    $(".pet-gallery img, .gallery img, .pet-photos img").each((_, img) => {
      const src = $(img).attr("src") || $(img).attr("data-src") || "";
      if (src && !photos.includes(src)) {
        photos.push(src);
      }
    });
    if (photos.length > 0) {
      details.photos = photos;
    }

    // Get detailed description
    const description = $(".pet-description, .pet-bio, .description, .about").text().trim();
    if (description) {
      details.description = description;
    }

    // Parse attributes
    const attributesText = $(".pet-attributes, .attributes, .details").text().toLowerCase();
    details.spayedNeutered = attributesText.includes("spayed") || attributesText.includes("neutered");
    details.houseTrained = attributesText.includes("house trained") || attributesText.includes("housebroken");
    details.shotsCurrent = attributesText.includes("vaccinated") || attributesText.includes("shots");
    details.goodWithChildren = attributesText.includes("kids") || attributesText.includes("children");
    details.goodWithDogs = attributesText.includes("dogs") && !attributesText.includes("no dogs");
    details.goodWithCats = attributesText.includes("cats") && !attributesText.includes("no cats");
  } catch (error) {
    console.error(`Error scraping pet details from ${url}:`, error);
  }

  return details;
}

function mapToShelterSlug(location: string): string {
  const lower = location.toLowerCase();
  if (lower.includes("south bay") || lower.includes("hawthorne")) {
    return "spcala-south-bay";
  }
  if (lower.includes("long beach") || lower.includes("pitchford")) {
    return "spcala-long-beach";
  }
  // Default to South Bay if location unknown
  return "spcala-south-bay";
}

export const spcalaScraper: Scraper = {
  name: "spcaLA",
  
  async scrape(shelterSlug?: string): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const shelters = getSheltersByScraperKey("spcala");
    const startTime = Date.now();

    // Scrape both dogs and cats pages
    const [dogs, cats] = await Promise.all([
      scrapeSPCALAPage(DOGS_URL, "Dog"),
      scrapeSPCALAPage(CATS_URL, "Cat"),
    ]);

    // Group pets by shelter location
    const shelterPets = new Map<string, ScrapedPet[]>();

    const allRawPets = [
      ...dogs.map(p => ({ ...p, species: "Dog" as const })),
      ...cats.map(p => ({ ...p, species: "Cat" as const })),
    ];

    for (const rawPet of allRawPets) {
      const slug = mapToShelterSlug(rawPet.location || "");
      
      const pet: ScrapedPet = {
        externalId: rawPet.id,
        name: rawPet.name,
        species: rawPet.species,
        breed: rawPet.breed || "Mixed Breed",
        age: normalizeAge(rawPet.age || "Adult"),
        gender: normalizeGender(rawPet.gender || "Unknown"),
        size: normalizeSize(rawPet.size || "Medium"),
        color: rawPet.color,
        description: rawPet.description,
        photos: rawPet.photo ? [rawPet.photo] : [],
        adoptionUrl: rawPet.url,
      };

      if (!shelterPets.has(slug)) {
        shelterPets.set(slug, []);
      }
      shelterPets.get(slug)!.push(pet);
    }

    // Build results for each shelter
    for (const shelter of shelters) {
      if (shelterSlug && shelter.slug !== shelterSlug) continue;

      const pets = shelterPets.get(shelter.slug) || [];

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

