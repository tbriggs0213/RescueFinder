"use client";

import { useEffect, useState } from "react";

interface AutoScrapeLoaderProps {
  petCount: number;
  lastScrapedAt: string | null;
}

export default function AutoScrapeLoader({ petCount, lastScrapedAt }: AutoScrapeLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Connecting to shelters...");
  const [error, setError] = useState<string | null>(null);
  const [petsFound, setPetsFound] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Always run scrape on mount
    runAutoScrape();
  }, []);

  const runAutoScrape = async () => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    // Progress simulation - takes about 90 seconds
    const startTime = Date.now();
    const totalDuration = 90000; // 90 seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 95, 95);
      setProgress(newProgress);
      
      // Update status messages based on progress
      if (newProgress < 15) {
        setStatusMessage("Connecting to LA County Animal Care...");
      } else if (newProgress < 30) {
        setStatusMessage("Fetching pets from Agoura, Baldwin Park...");
      } else if (newProgress < 45) {
        setStatusMessage("Fetching pets from Carson, Downey...");
      } else if (newProgress < 60) {
        setStatusMessage("Fetching pets from Lancaster, Palmdale...");
      } else if (newProgress < 75) {
        setStatusMessage("Processing pet photos and details...");
      } else if (newProgress < 90) {
        setStatusMessage("Saving to database...");
      } else {
        setStatusMessage("Almost done...");
      }
    }, 500);

    try {
      const response = await fetch("/api/scrape", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      clearInterval(progressInterval);
      
      if (data.success) {
        setProgress(100);
        setPetsFound(data.summary?.totalPetsFound || 0);
        setStatusMessage(`Found ${data.summary?.totalPetsFound || 0} pets!`);
        setIsDone(true);
        
        // Reload the page after a short delay to show results
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || "Unknown error occurred");
        setProgress(100);
        setStatusMessage("Error occurred");
        
        // Still reload after error to show whatever we have
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Failed to fetch pets");
      setProgress(100);
      
      // Reload anyway after error
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 text-center">
        {/* Animated Paw Prints */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="animate-bounce text-3xl" style={{ animationDelay: "0s" }}>🐾</div>
          <div className="animate-bounce text-4xl" style={{ animationDelay: "0.2s" }}>🐾</div>
          <div className="animate-bounce text-3xl" style={{ animationDelay: "0.4s" }}>🐾</div>
        </div>

        {/* Main Icon */}
        <div className="relative mb-6">
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-200">
            <span className="text-7xl">{isDone ? "🎉" : "🐕"}</span>
          </div>
          {!isDone && (
            <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="animate-spin">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="font-bold text-4xl text-orange-800 mb-2">
          {isDone ? "Pets Found!" : "Loading Pets"}
        </h1>
        <p className="text-orange-600 text-lg mb-8">
          {isDone 
            ? `We found ${petsFound} adoptable pets!`
            : "Please wait while we fetch the latest pets from LA County shelters"
          }
        </p>

        {/* Progress Bar */}
        <div className="bg-orange-100 rounded-full h-6 mb-4 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isDone 
                ? "bg-gradient-to-r from-green-400 to-green-500" 
                : error 
                ? "bg-gradient-to-r from-red-400 to-red-500"
                : "bg-gradient-to-r from-orange-400 to-amber-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <div className="flex justify-between text-sm text-orange-600 mb-4 font-medium">
          <span>{Math.round(progress)}% complete</span>
          <span>{isDone ? "Done!" : "~90 seconds total"}</span>
        </div>

        {/* Status Message */}
        <p className={`text-lg font-medium ${error ? "text-red-500" : isDone ? "text-green-600" : "text-orange-500"} animate-pulse`}>
          {error || statusMessage}
        </p>

        {/* Fun Facts */}
        {!isDone && !error && (
          <div className="mt-8 p-4 bg-white/70 rounded-xl border border-orange-200 shadow-sm">
            <p className="text-xs text-orange-400 mb-1 uppercase tracking-wide">Did you know?</p>
            <p className="text-sm text-orange-700">
              Over 6 million pets enter US shelters every year. 
              By adopting, you're saving a life! 💕
            </p>
          </div>
        )}

        {isDone && (
          <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <p className="text-green-700 font-medium">
              ✅ Loading results... Page will refresh automatically!
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
            <p className="text-red-700">
              ⚠️ {error}
            </p>
            <p className="text-red-500 text-sm mt-2">
              Refreshing page in a moment...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
