// Scraper types and interfaces

export interface ScrapedPet {
  externalId: string;
  name: string;
  species: "Dog" | "Cat" | "Rabbit" | "Bird" | "Other";
  breed: string;
  breedSecondary?: string;
  age: "Baby" | "Young" | "Adult" | "Senior";
  gender: "Male" | "Female" | "Unknown";
  size: "Small" | "Medium" | "Large" | "Extra Large";
  description?: string;
  color?: string;
  photos: string[];
  adoptionUrl?: string;
  intakeDate?: Date;
  
  // Attributes
  spayedNeutered?: boolean;
  houseTrained?: boolean;
  specialNeeds?: boolean;
  shotsCurrent?: boolean;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  shelterId: string;
  shelterName: string;
  pets: ScrapedPet[];
  error?: string;
  duration: number;
}

export interface Scraper {
  name: string;
  scrape(shelterSlug?: string): Promise<ScrapeResult[]>;
}

// Helper to normalize age strings
export function normalizeAge(age: string): "Baby" | "Young" | "Adult" | "Senior" {
  const lower = age.toLowerCase();
  if (lower.includes("baby") || lower.includes("kitten") || lower.includes("puppy") || lower.includes("newborn")) {
    return "Baby";
  }
  if (lower.includes("young") || lower.includes("juvenile") || lower.includes("adolescent")) {
    return "Young";
  }
  if (lower.includes("senior") || lower.includes("old") || lower.includes("geriatric")) {
    return "Senior";
  }
  return "Adult";
}

// Helper to normalize size strings
export function normalizeSize(size: string): "Small" | "Medium" | "Large" | "Extra Large" {
  const lower = size.toLowerCase();
  if (lower.includes("extra large") || lower.includes("xl") || lower.includes("giant")) {
    return "Extra Large";
  }
  if (lower.includes("large") || lower.includes("lg")) {
    return "Large";
  }
  if (lower.includes("small") || lower.includes("sm") || lower.includes("tiny") || lower.includes("toy")) {
    return "Small";
  }
  return "Medium";
}

// Helper to normalize gender strings
export function normalizeGender(gender: string): "Male" | "Female" | "Unknown" {
  const lower = gender.toLowerCase();
  if (lower.includes("male") || lower === "m") {
    return lower.includes("female") ? "Female" : "Male";
  }
  if (lower.includes("female") || lower === "f") {
    return "Female";
  }
  return "Unknown";
}

// Helper to normalize species strings
export function normalizeSpecies(species: string): "Dog" | "Cat" | "Rabbit" | "Bird" | "Other" {
  const lower = species.toLowerCase();
  if (lower.includes("dog") || lower.includes("canine") || lower.includes("puppy")) {
    return "Dog";
  }
  if (lower.includes("cat") || lower.includes("feline") || lower.includes("kitten")) {
    return "Cat";
  }
  if (lower.includes("rabbit") || lower.includes("bunny")) {
    return "Rabbit";
  }
  if (lower.includes("bird") || lower.includes("parrot") || lower.includes("parakeet")) {
    return "Bird";
  }
  return "Other";
}

