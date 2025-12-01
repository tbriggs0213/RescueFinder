"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AutoScrapeLoaderProps {
  petCount: number;
  lastScrapedAt: string | null;
}

export default function AutoScrapeLoader({ petCount, lastScrapedAt }: AutoScrapeLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const router = useRouter();

  useEffect(() => {
    // Check if we need to auto-scrape
    const shouldScrape = checkIfShouldScrape(petCount, lastScrapedAt);
    
    if (shouldScrape) {
      runAutoScrape();
    }
  }, [petCount, lastScrapedAt]);

  const checkIfShouldScrape = (count: number, lastScraped: string | null): boolean => {
    // Always scrape if no pets
    if (count === 0) return true;
    
    // Scrape if last scrape was more than 6 hours ago
    if (lastScraped) {
      const lastScrapedDate = new Date(lastScraped);
      const now = new Date();
      const hoursSinceLastScrape = (now.getTime() - lastScrapedDate.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastScrape > 6;
    }
    
    return false;
  };

  const runAutoScrape = async () => {
    setIsLoading(true);
    setProgress(0);
    setStatusMessage("Connecting to LA County shelters...");

    // Simulate progress while scraping
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 3 + 1;
        return Math.min(prev + increment, 95);
      });
    }, 1000);

    // Update status messages
    const messages = [
      { time: 3000, msg: "Fetching pets from Agoura Animal Care Center..." },
      { time: 8000, msg: "Fetching pets from Baldwin Park Animal Care Center..." },
      { time: 15000, msg: "Fetching pets from Carson Animal Care Center..." },
      { time: 22000, msg: "Fetching pets from Downey Animal Care Center..." },
      { time: 35000, msg: "Fetching pets from Lancaster Animal Care Center..." },
      { time: 50000, msg: "Processing pet photos..." },
      { time: 65000, msg: "Saving to database..." },
      { time: 80000, msg: "Almost done..." },
    ];

    messages.forEach(({ time, msg }) => {
      setTimeout(() => setStatusMessage(msg), time);
    });

    try {
      const response = await fetch("/api/scrape", { method: "POST" });
      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatusMessage(`Found ${data.summary?.totalPetsFound || 0} pets! Loading...`);
      
      // Short delay to show completion, then refresh
      setTimeout(() => {
        router.refresh();
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setStatusMessage("Error loading pets. Please refresh the page.");
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-primary-50 via-white to-shelter-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 text-center">
        {/* Animated Paw Prints */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="animate-bounce" style={{ animationDelay: "0s" }}>🐾</div>
          <div className="animate-bounce text-2xl" style={{ animationDelay: "0.2s" }}>🐾</div>
          <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>🐾</div>
        </div>

        {/* Main Icon */}
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-400 to-shelter-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-200 animate-pulse">
            <span className="text-6xl">🐕</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold text-primary-800 mb-2">
          Finding Your Perfect Pet
        </h1>
        <p className="text-primary-600 mb-8">
          We're fetching the latest adoptable pets from LA County shelters
        </p>

        {/* Progress Bar */}
        <div className="bg-primary-100 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-shelter-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <div className="flex justify-between text-sm text-primary-600 mb-4">
          <span>{Math.round(progress)}%</span>
          <span>~90 seconds</span>
        </div>

        {/* Status Message */}
        <p className="text-primary-500 text-sm animate-pulse">
          {statusMessage}
        </p>

        {/* Fun Facts */}
        <div className="mt-8 p-4 bg-white/50 rounded-xl border border-primary-100">
          <p className="text-xs text-primary-400 mb-1">Did you know?</p>
          <p className="text-sm text-primary-600">
            Over 6 million pets enter US shelters every year. 
            By adopting, you're saving a life! 💕
          </p>
        </div>
      </div>
    </div>
  );
}

