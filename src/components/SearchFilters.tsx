"use client";

import { useState } from "react";

interface SearchFiltersProps {
  onSearch: (filters: FilterState) => void;
  breeds: { dogs: string[]; cats: string[] };
  isLoading?: boolean;
}

export interface FilterState {
  species: string;
  breed: string;
  age: string;
  size: string;
  gender: string;
}

const SPECIES_OPTIONS = [
  { value: "", label: "All Animals" },
  { value: "Dog", label: "Dogs" },
  { value: "Cat", label: "Cats" },
  { value: "Rabbit", label: "Rabbits" },
  { value: "Bird", label: "Birds" },
];

const AGE_OPTIONS = [
  { value: "", label: "Any Age" },
  { value: "Baby", label: "Baby" },
  { value: "Young", label: "Young" },
  { value: "Adult", label: "Adult" },
  { value: "Senior", label: "Senior" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Any Size" },
  { value: "Small", label: "Small" },
  { value: "Medium", label: "Medium" },
  { value: "Large", label: "Large" },
  { value: "Extra Large", label: "Extra Large" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Any Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

export default function SearchFilters({
  onSearch,
  breeds,
  isLoading,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    species: "",
    breed: "",
    age: "",
    size: "",
    gender: "",
  });

  const handleChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value };
    
    // Reset breed when species changes
    if (field === "species") {
      newFilters.breed = "";
    }
    
    setFilters(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      species: "",
      breed: "",
      age: "",
      size: "",
      gender: "",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const getBreedOptions = () => {
    if (filters.species === "Dog") return breeds.dogs;
    if (filters.species === "Cat") return breeds.cats;
    return [];
  };

  const breedOptions = getBreedOptions();
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-primary-100/50 border border-primary-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-primary-900">
            Find Your Perfect Pet
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Species */}
          <div>
            <label
              htmlFor="species"
              className="block text-sm font-medium text-primary-700 mb-1.5"
            >
              Animal Type
            </label>
            <select
              id="species"
              value={filters.species}
              onChange={(e) => handleChange("species", e.target.value)}
              className="w-full px-3 py-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
            >
              {SPECIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label
              htmlFor="breed"
              className="block text-sm font-medium text-primary-700 mb-1.5"
            >
              Breed
            </label>
            <select
              id="breed"
              value={filters.breed}
              onChange={(e) => handleChange("breed", e.target.value)}
              disabled={!filters.species || breedOptions.length === 0}
              className="w-full px-3 py-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Any Breed</option>
              {breedOptions.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-primary-700 mb-1.5"
            >
              Age
            </label>
            <select
              id="age"
              value={filters.age}
              onChange={(e) => handleChange("age", e.target.value)}
              className="w-full px-3 py-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
            >
              {AGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-primary-700 mb-1.5"
            >
              Size
            </label>
            <select
              id="size"
              value={filters.size}
              onChange={(e) => handleChange("size", e.target.value)}
              className="w-full px-3 py-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-primary-700 mb-1.5"
            >
              Gender
            </label>
            <select
              id="gender"
              value={filters.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="w-full px-3 py-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-200 hover:shadow-primary-300 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search Pets
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

