export interface Pet {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Rabbit" | "Bird" | "Other";
  breed: string;
  breedSecondary?: string;
  age: "Baby" | "Young" | "Adult" | "Senior";
  gender: "Male" | "Female" | "Unknown";
  size: "Small" | "Medium" | "Large" | "Extra Large";
  description: string;
  photos: PetPhoto[];
  status: "adoptable" | "adopted" | "pending";
  attributes: PetAttributes;
  shelter: Shelter;
  daysInShelter: number;
  adoptionUrl: string;
  publishedAt: string;
}

export interface PetPhoto {
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface PetAttributes {
  spayedNeutered: boolean;
  houseTrained: boolean;
  specialNeeds: boolean;
  shotsCurrent: boolean;
  goodWithChildren: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  website?: string;
  distance?: number;
}

export interface SearchFilters {
  species?: string;
  breed?: string;
  age?: string;
  size?: string;
  gender?: string;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
}

export interface PetSearchResponse {
  pets: Pet[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

