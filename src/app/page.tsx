"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import SearchFilters, { FilterState } from "@/components/SearchFilters";
import PetGrid from "@/components/PetGrid";
import Pagination from "@/components/Pagination";
import AdminPanel from "@/components/AdminPanel";
import AutoScrapeLoader from "@/components/AutoScrapeLoader";
import { Pet } from "@/types/pet";

interface BreedsData {
  dogs: string[];
  cats: string[];
}

interface ScrapeStatus {
  petCount: number;
  lastScrapedAt: string | null;
  needsScrape: boolean;
}

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [breeds, setBreeds] = useState<BreedsData>({ dogs: [], cats: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    species: "",
    breed: "",
    age: "",
    size: "",
    gender: "",
  });

  // Check scrape status on mount
  useEffect(() => {
    const checkScrapeStatus = async () => {
      try {
        const response = await fetch("/api/scrape-status");
        const status = await response.json();
        // If we have pets and scraped recently, don't show loader
        if (status.petCount > 0 && !status.needsScrape) {
          setScrapeStatus({ ...status, needsScrape: false });
        } else {
          // Force scrape if no pets or stale data
          setScrapeStatus({ petCount: 0, lastScrapedAt: null, needsScrape: true });
        }
      } catch (error) {
        console.error("Error checking scrape status:", error);
        // On error, trigger scrape
        setScrapeStatus({ petCount: 0, lastScrapedAt: null, needsScrape: true });
      }
    };
    checkScrapeStatus();
  }, []);

  const fetchBreeds = useCallback(async () => {
    try {
      const [dogsRes, catsRes] = await Promise.all([
        fetch("/api/breeds?species=Dog"),
        fetch("/api/breeds?species=Cat"),
      ]);
      const dogsData = await dogsRes.json();
      const catsData = await catsRes.json();
      setBreeds({
        dogs: dogsData.breeds || [],
        cats: catsData.breeds || [],
      });
    } catch (error) {
      console.error("Error fetching breeds:", error);
    }
  }, []);

  const fetchPets = useCallback(
    async (filters: FilterState, page: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.species) params.append("species", filters.species);
        if (filters.breed) params.append("breed", filters.breed);
        if (filters.age) params.append("age", filters.age);
        if (filters.size) params.append("size", filters.size);
        if (filters.gender) params.append("gender", filters.gender);
        params.append("page", page.toString());

        const response = await fetch(`/api/pets?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
          console.error("API error:", data.error);
          setPets([]);
        } else {
          setPets(data.pets || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.totalCount || 0);
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
        setPets([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBreeds();
    fetchPets(currentFilters, 1);
  }, [fetchBreeds, fetchPets, currentFilters]);

  const handleSearch = (filters: FilterState) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    fetchPets(filters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPets(currentFilters, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Auto-scrape loader for first-time visitors or stale data */}
      {scrapeStatus && scrapeStatus.needsScrape && (
        <AutoScrapeLoader 
          petCount={scrapeStatus.petCount} 
          lastScrapedAt={scrapeStatus.lastScrapedAt} 
        />
      )}
      
      <Header />
      <AdminPanel />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-shelter-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-shelter-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900 mb-4">
              Find Your New
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-shelter-500">
                Best Friend
              </span>
            </h1>
            <p className="text-lg text-primary-600 max-w-2xl mx-auto">
              Discover adoptable pets from shelters and rescues across Los
              Angeles County. Every pet deserves a loving home. 🐾
            </p>
          </div>

          <SearchFilters
            onSearch={handleSearch}
            breeds={breeds}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-primary-900">
              {isLoading ? (
                "Searching..."
              ) : totalCount > 0 ? (
                <>
                  {totalCount.toLocaleString()} pets available
                  <span className="text-primary-500 font-normal text-lg ml-2">
                    in Los Angeles County
                  </span>
                </>
              ) : (
                "No pets found"
              )}
            </h2>
          </div>
        </div>

        <PetGrid pets={pets} isLoading={isLoading} />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <span className="font-display text-xl font-bold">
                  RescueFinder
                </span>
              </div>
              <p className="text-primary-300 text-sm">
                Helping connect rescue pets with loving families across Los
                Angeles County.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-primary-300 text-sm">
                <li>
                  <a href="/" className="hover:text-white transition-colors">
                    Find Pets
                  </a>
                </li>
                <li>
                  <a
                    href="/shelters"
                    className="hover:text-white transition-colors"
                  >
                    Shelters
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Data Sources</h3>
              <ul className="space-y-2 text-primary-300 text-sm">
                <li>
                  <a
                    href="https://animalcare.lacounty.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    LA County Animal Care
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.laanimalservices.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    LA City Animal Services
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-800 mt-8 pt-8 text-center text-primary-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} RescueFinder. Made with ❤️ for
              rescue pets.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

