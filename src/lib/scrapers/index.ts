// Scraper Registry and Runner

import { Scraper, ScrapeResult } from "./types";
import { laCountyScraper } from "./la-county";
import { laCityScraper } from "./la-city";
import { spcalaScraper } from "./spcala";
import { pasadenaHumaneScraper } from "./pasadena-humane";
import { bestFriendsScraper } from "./best-friends";
import prisma from "../db";
import { LA_COUNTY_SHELTERS } from "../shelters";

// Registry of all scrapers
export const scrapers: Record<string, Scraper> = {
  "la-county": laCountyScraper,
  "la-city": laCityScraper,
  "spcala": spcalaScraper,
  "pasadena-humane": pasadenaHumaneScraper,
  "best-friends": bestFriendsScraper,
};

// Initialize shelters in the database
export async function initializeShelters(): Promise<void> {
  console.log("Initializing shelters in database...");
  
  for (const shelter of LA_COUNTY_SHELTERS) {
    await prisma.shelter.upsert({
      where: { slug: shelter.slug },
      update: {
        name: shelter.name,
        website: shelter.website,
        adoptionUrl: shelter.adoptionUrl,
        email: shelter.email,
        phone: shelter.phone,
        street: shelter.street,
        city: shelter.city,
        postcode: shelter.postcode,
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        platform: shelter.platform,
        scraperKey: shelter.scraperKey,
      },
      create: {
        name: shelter.name,
        slug: shelter.slug,
        website: shelter.website,
        adoptionUrl: shelter.adoptionUrl,
        email: shelter.email,
        phone: shelter.phone,
        street: shelter.street,
        city: shelter.city,
        postcode: shelter.postcode,
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        platform: shelter.platform,
        scraperKey: shelter.scraperKey,
      },
    });
  }
  
  console.log(`Initialized ${LA_COUNTY_SHELTERS.length} shelters`);
}

// Run a single scraper and save results
export async function runScraper(scraperKey: string): Promise<ScrapeResult[]> {
  const scraper = scrapers[scraperKey];
  if (!scraper) {
    throw new Error(`Unknown scraper: ${scraperKey}`);
  }

  console.log(`Running scraper: ${scraper.name}`);
  const results = await scraper.scrape();
  
  // Process and save results
  for (const result of results) {
    await saveScrapedPets(result);
  }

  return results;
}

// Run all scrapers
export async function runAllScrapers(): Promise<ScrapeResult[]> {
  console.log("Running all scrapers...");
  const allResults: ScrapeResult[] = [];

  for (const [key, scraper] of Object.entries(scrapers)) {
    try {
      console.log(`Running ${scraper.name}...`);
      const results = await scraper.scrape();
      
      for (const result of results) {
        await saveScrapedPets(result);
        allResults.push(result);
      }
    } catch (error) {
      console.error(`Error running scraper ${key}:`, error);
      allResults.push({
        success: false,
        shelterId: key,
        shelterName: scraper.name,
        pets: [],
        error: error instanceof Error ? error.message : "Unknown error",
        duration: 0,
      });
    }
  }

  return allResults;
}

// Save scraped pets to the database
async function saveScrapedPets(result: ScrapeResult): Promise<void> {
  const startTime = Date.now();
  let petsAdded = 0;
  let petsUpdated = 0;
  let petsRemoved = 0;

  try {
    // Get shelter from database
    const shelter = await prisma.shelter.findUnique({
      where: { slug: result.shelterId },
    });

    if (!shelter) {
      console.error(`Shelter not found: ${result.shelterId}`);
      return;
    }

    // Get current pets for this shelter
    const existingPets = await prisma.pet.findMany({
      where: { shelterId: shelter.id },
      select: { id: true, externalId: true },
    });

    const existingIds = new Set(existingPets.map(p => p.externalId));
    const scrapedIds = new Set(result.pets.map(p => p.externalId));

    // Add or update pets using upsert to avoid race conditions
    for (const pet of result.pets) {
      try {
        const existing = existingPets.find(p => p.externalId === pet.externalId);

        // Use upsert to handle race conditions gracefully
        const upsertedPet = await prisma.pet.upsert({
          where: {
            shelterId_externalId: {
              shelterId: shelter.id,
              externalId: pet.externalId,
            },
          },
          update: {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            breedSecondary: pet.breedSecondary,
            age: pet.age,
            gender: pet.gender,
            size: pet.size,
            description: pet.description,
            color: pet.color,
            adoptionUrl: pet.adoptionUrl,
            spayedNeutered: pet.spayedNeutered ?? false,
            houseTrained: pet.houseTrained ?? false,
            specialNeeds: pet.specialNeeds ?? false,
            shotsCurrent: pet.shotsCurrent ?? false,
            goodWithChildren: pet.goodWithChildren,
            goodWithDogs: pet.goodWithDogs,
            goodWithCats: pet.goodWithCats,
            lastSeen: new Date(),
            isAvailable: true,
          },
          create: {
            externalId: pet.externalId,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            breedSecondary: pet.breedSecondary,
            age: pet.age,
            gender: pet.gender,
            size: pet.size,
            description: pet.description,
            color: pet.color,
            adoptionUrl: pet.adoptionUrl,
            intakeDate: pet.intakeDate,
            spayedNeutered: pet.spayedNeutered ?? false,
            houseTrained: pet.houseTrained ?? false,
            specialNeeds: pet.specialNeeds ?? false,
            shotsCurrent: pet.shotsCurrent ?? false,
            goodWithChildren: pet.goodWithChildren,
            goodWithDogs: pet.goodWithDogs,
            goodWithCats: pet.goodWithCats,
            shelterId: shelter.id,
          },
        });

        if (existing) {
          petsUpdated++;
        } else {
          petsAdded++;
        }
        
        // Always update photos (delete old, add new)
        if (pet.photos.length > 0) {
          // Delete existing photos first
          await prisma.petPhoto.deleteMany({
            where: { petId: upsertedPet.id },
          });
          
          await prisma.petPhoto.createMany({
            data: pet.photos.map((url, index) => ({
              petId: upsertedPet.id,
              url,
              isPrimary: index === 0,
              sortOrder: index,
            })),
          });
        }
      } catch (petError) {
        console.error(`Error saving pet ${pet.externalId}:`, petError);
      }
    }

    // Mark pets that weren't found as unavailable
    for (const existing of existingPets) {
      if (!scrapedIds.has(existing.externalId)) {
        await prisma.pet.update({
          where: { id: existing.id },
          data: { isAvailable: false },
        });
        petsRemoved++;
      }
    }

    // Update shelter's last scraped time
    await prisma.shelter.update({
      where: { id: shelter.id },
      data: { lastScraped: new Date() },
    });

    // Log the scrape
    await prisma.scrapeLog.create({
      data: {
        shelterId: shelter.id,
        shelterName: shelter.name,
        status: result.success ? "success" : "error",
        petsFound: result.pets.length,
        petsAdded,
        petsUpdated,
        petsRemoved,
        errorMessage: result.error,
        duration: Date.now() - startTime,
      },
    });

    console.log(
      `${shelter.name}: Found ${result.pets.length} pets, ` +
      `added ${petsAdded}, updated ${petsUpdated}, removed ${petsRemoved}`
    );
  } catch (error) {
    console.error(`Error saving pets for ${result.shelterName}:`, error);
    
    // Log the error
    await prisma.scrapeLog.create({
      data: {
        shelterId: result.shelterId,
        shelterName: result.shelterName,
        status: "error",
        petsFound: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
    });
  }
}

export type { ScrapedPet, ScrapeResult, Scraper } from "./types";

