// LA County Shelter Registry
// This contains all the shelters we scrape data from

export interface ShelterConfig {
  name: string;
  slug: string;
  website: string;
  adoptionUrl: string;
  email?: string;
  phone?: string;
  street?: string;
  city: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  platform: string;
  scraperKey: string;
}

export const LA_COUNTY_SHELTERS: ShelterConfig[] = [
  // ========================================
  // LA COUNTY ANIMAL CARE CENTERS (6 locations)
  // Platform: PetPoint/Chameleon
  // ========================================
  {
    name: "Agoura Animal Care Center",
    slug: "la-county-agoura",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(818) 991-0071",
    street: "29525 Agoura Road",
    city: "Agoura Hills",
    postcode: "91301",
    latitude: 34.1436,
    longitude: -118.7617,
    platform: "petpoint",
    scraperKey: "la-county",
  },
  {
    name: "Baldwin Park Animal Care Center",
    slug: "la-county-baldwin-park",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(626) 962-3577",
    street: "4275 Elton Street",
    city: "Baldwin Park",
    postcode: "91706",
    latitude: 34.0853,
    longitude: -117.9609,
    platform: "petpoint",
    scraperKey: "la-county",
  },
  {
    name: "Carson Animal Care Center",
    slug: "la-county-carson",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(310) 523-9566",
    street: "216 West Victoria Street",
    city: "Carson",
    postcode: "90248",
    latitude: 33.8317,
    longitude: -118.2620,
    platform: "petpoint",
    scraperKey: "la-county",
  },
  {
    name: "Castaic Animal Care Center",
    slug: "la-county-castaic",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(661) 257-3191",
    street: "31044 Charlie Canyon Road",
    city: "Castaic",
    postcode: "91384",
    latitude: 34.4897,
    longitude: -118.6253,
    platform: "petpoint",
    scraperKey: "la-county",
  },
  {
    name: "Downey Animal Care Center",
    slug: "la-county-downey",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(562) 940-6898",
    street: "11258 South Garfield Avenue",
    city: "Downey",
    postcode: "90242",
    latitude: 33.9164,
    longitude: -118.1581,
    platform: "petpoint",
    scraperKey: "la-county",
  },
  {
    name: "Lancaster Animal Care Center",
    slug: "la-county-lancaster",
    website: "https://animalcare.lacounty.gov/",
    adoptionUrl: "https://animalcare.lacounty.gov/adoptable-animals/",
    phone: "(661) 940-4191",
    street: "5210 West Avenue I",
    city: "Lancaster",
    postcode: "93536",
    latitude: 34.6783,
    longitude: -118.1690,
    platform: "petpoint",
    scraperKey: "la-county",
  },

  // ========================================
  // LA CITY ANIMAL SERVICES (6 shelters)
  // Platform: PetPoint-based
  // ========================================
  {
    name: "East Valley Animal Shelter",
    slug: "la-city-east-valley",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "14409 Vanowen Street",
    city: "Van Nuys",
    postcode: "91405",
    latitude: 34.1936,
    longitude: -118.4314,
    platform: "petpoint",
    scraperKey: "la-city",
  },
  {
    name: "West Valley Animal Shelter",
    slug: "la-city-west-valley",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "20655 Plummer Street",
    city: "Chatsworth",
    postcode: "91311",
    latitude: 34.2578,
    longitude: -118.5717,
    platform: "petpoint",
    scraperKey: "la-city",
  },
  {
    name: "West LA Animal Shelter",
    slug: "la-city-west-la",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "11361 West Pico Boulevard",
    city: "Los Angeles",
    postcode: "90064",
    latitude: 34.0338,
    longitude: -118.4454,
    platform: "petpoint",
    scraperKey: "la-city",
  },
  {
    name: "North Central Animal Shelter",
    slug: "la-city-north-central",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "3201 Lacy Street",
    city: "Los Angeles",
    postcode: "90031",
    latitude: 34.0764,
    longitude: -118.2089,
    platform: "petpoint",
    scraperKey: "la-city",
  },
  {
    name: "South LA Animal Shelter",
    slug: "la-city-south-la",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "1850 West 60th Street",
    city: "Los Angeles",
    postcode: "90047",
    latitude: 33.9831,
    longitude: -118.3114,
    platform: "petpoint",
    scraperKey: "la-city",
  },
  {
    name: "Harbor Animal Shelter",
    slug: "la-city-harbor",
    website: "https://www.laanimalservices.com/",
    adoptionUrl: "https://www.laanimalservices.com/adopt/",
    phone: "(888) 452-7381",
    street: "957 North Gaffey Street",
    city: "San Pedro",
    postcode: "90731",
    latitude: 33.7406,
    longitude: -118.2892,
    platform: "petpoint",
    scraperKey: "la-city",
  },

  // ========================================
  // PASADENA HUMANE
  // Platform: Third-party (Petstablished-like)
  // ========================================
  {
    name: "Pasadena Humane",
    slug: "pasadena-humane",
    website: "https://pasadenahumane.org/",
    adoptionUrl: "https://pasadenahumane.org/adopt/",
    phone: "(626) 792-7151",
    street: "361 South Raymond Avenue",
    city: "Pasadena",
    postcode: "91105",
    latitude: 34.1386,
    longitude: -118.1489,
    platform: "custom",
    scraperKey: "pasadena-humane",
  },

  // ========================================
  // spcaLA (5 locations)
  // Platform: Custom CMS
  // ========================================
  {
    name: "spcaLA South Bay Pet Adoption Center",
    slug: "spcala-south-bay",
    website: "https://spcala.com/",
    adoptionUrl: "https://spcala.com/adoptable/dogs/",
    phone: "(310) 676-1149",
    street: "12910 Yukon Avenue",
    city: "Hawthorne",
    postcode: "90250",
    latitude: 33.9164,
    longitude: -118.3514,
    platform: "custom",
    scraperKey: "spcala",
  },
  {
    name: "spcaLA P.D. Pitchford Companion Animal Village",
    slug: "spcala-long-beach",
    website: "https://spcala.com/",
    adoptionUrl: "https://spcala.com/adoptable/dogs/",
    phone: "(562) 570-7722",
    street: "7700 East Spring Street",
    city: "Long Beach",
    postcode: "90815",
    latitude: 33.8092,
    longitude: -118.1117,
    platform: "custom",
    scraperKey: "spcala",
  },

  // ========================================
  // BEST FRIENDS ANIMAL SOCIETY - LA
  // Platform: National database
  // ========================================
  {
    name: "Best Friends Lifesaving Center - Los Angeles",
    slug: "best-friends-la",
    website: "https://bestfriends.org/",
    adoptionUrl: "https://bestfriends.org/adopt-pet",
    phone: "(424) 208-8840",
    street: "15321 Brand Boulevard",
    city: "Mission Hills",
    postcode: "91345",
    latitude: 34.2717,
    longitude: -118.4617,
    platform: "custom",
    scraperKey: "best-friends",
  },

  // ========================================
  // LONG BEACH ANIMAL CARE SERVICES
  // Platform: PetPoint or custom
  // ========================================
  {
    name: "Long Beach Animal Care Services",
    slug: "long-beach-acs",
    website: "https://www.longbeach.gov/acs/",
    adoptionUrl: "https://www.longbeach.gov/acs/pet-adoptions/",
    phone: "(562) 570-7387",
    street: "7700 East Spring Street",
    city: "Long Beach",
    postcode: "90815",
    latitude: 33.8097,
    longitude: -118.1120,
    platform: "petpoint",
    scraperKey: "long-beach",
  },

  // ========================================
  // ADDITIONAL LA COUNTY SHELTERS
  // ========================================
  {
    name: "Burbank Animal Shelter",
    slug: "burbank-animal-shelter",
    website: "https://www.burbankca.gov/departments/police/animal-shelter",
    adoptionUrl: "https://www.burbankca.gov/departments/police/animal-shelter/adopt-a-pet",
    phone: "(818) 238-3340",
    street: "1150 North Victory Place",
    city: "Burbank",
    postcode: "91502",
    latitude: 34.1872,
    longitude: -118.3389,
    platform: "custom",
    scraperKey: "burbank",
  },
  {
    name: "Glendale Humane Society",
    slug: "glendale-humane",
    website: "https://www.glendalehumanesociety.org/",
    adoptionUrl: "https://www.glendalehumanesociety.org/adopt/",
    phone: "(818) 242-1128",
    street: "717 West Ivy Street",
    city: "Glendale",
    postcode: "91204",
    latitude: 34.1475,
    longitude: -118.2558,
    platform: "custom",
    scraperKey: "glendale-humane",
  },
  {
    name: "San Gabriel Valley Humane Society",
    slug: "sgv-humane",
    website: "https://www.sgvhumane.org/",
    adoptionUrl: "https://www.sgvhumane.org/adopt",
    phone: "(626) 286-1159",
    street: "851 East Grand Avenue",
    city: "San Gabriel",
    postcode: "91776",
    latitude: 34.0939,
    longitude: -118.0925,
    platform: "custom",
    scraperKey: "sgv-humane",
  },
  {
    name: "Inland Valley Humane Society",
    slug: "inland-valley-humane",
    website: "https://www.ivhsspca.org/",
    adoptionUrl: "https://www.ivhsspca.org/adopt/",
    phone: "(909) 623-9777",
    street: "500 Humane Way",
    city: "Pomona",
    postcode: "91766",
    latitude: 34.0614,
    longitude: -117.7531,
    platform: "custom",
    scraperKey: "inland-valley",
  },
  {
    name: "Santa Monica Animal Shelter",
    slug: "santa-monica-shelter",
    website: "https://www.santamonica.gov/animal-shelter",
    adoptionUrl: "https://www.santamonica.gov/animal-shelter",
    phone: "(310) 458-8594",
    street: "1640 9th Street",
    city: "Santa Monica",
    postcode: "90404",
    latitude: 34.0211,
    longitude: -118.4803,
    platform: "custom",
    scraperKey: "santa-monica",
  },
  {
    name: "Pets Without Partners",
    slug: "pets-without-partners",
    website: "https://petswithoutpartners.org/",
    adoptionUrl: "https://petswithoutpartners.org/adopt/",
    phone: "(562) 928-3944",
    street: "12720 Monte Vista Street",
    city: "Whittier",
    postcode: "90601",
    latitude: 33.9617,
    longitude: -118.0167,
    platform: "custom",
    scraperKey: "pets-without-partners",
  },
];

export function getShelterBySlug(slug: string): ShelterConfig | undefined {
  return LA_COUNTY_SHELTERS.find((s) => s.slug === slug);
}

export function getSheltersByScraperKey(key: string): ShelterConfig[] {
  return LA_COUNTY_SHELTERS.filter((s) => s.scraperKey === key);
}

