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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[AutoScrape] ${message}`);
  };

  useEffect(() => {
    // Check if we already tried scraping in this session
    const lastScrapeAttempt = sessionStorage.getItem('lastScrapeAttempt');
    const now = Date.now();
    
    // If we tried scraping in the last 5 minutes, don't try again (break the loop)
    if (lastScrapeAttempt && (now - parseInt(lastScrapeAttempt)) < 5 * 60 * 1000) {
      addLog("Scrape was attempted recently, skipping to prevent loop");
      setIsLoading(false);
      return;
    }
    
    // Mark that we're attempting a scrape
    sessionStorage.setItem('lastScrapeAttempt', now.toString());
    addLog("Starting auto-scrape...");
    runAutoScrape();
  }, []);

  const runAutoScrape = async () => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    // Progress simulation
    const startTime = Date.now();
    const totalDuration = 90000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 95, 95);
      setProgress(newProgress);
      
      if (newProgress < 15) {
        setStatusMessage("Connecting to LA County Animal Care...");
      } else if (newProgress < 30) {
        setStatusMessage("Fetching pets from shelters...");
      } else if (newProgress < 60) {
        setStatusMessage("Processing pet data...");
      } else if (newProgress < 90) {
        setStatusMessage("Saving to database...");
      } else {
        setStatusMessage("Almost done...");
      }
    }, 500);

    try {
      addLog("Calling /api/scrape...");
      
      const response = await fetch("/api/scrape", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      addLog(`Response status: ${response.status}`);
      
      const data = await response.json();
      addLog(`Response data: ${JSON.stringify(data).substring(0, 500)}`);
      
      clearInterval(progressInterval);
      
      if (data.success) {
        const totalPets = data.summary?.totalPetsFound || 0;
        setProgress(100);
        setPetsFound(totalPets);
        setStatusMessage(`Found ${totalPets} pets!`);
        setIsDone(true);
        addLog(`Success! Found ${totalPets} pets`);
        
        if (totalPets > 0) {
          // Only reload if we actually found pets
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          addLog("No pets found - staying on page to show error");
          setError("No pets found from shelters. The scraper may be having issues.");
        }
      } else {
        addLog(`Error from API: ${data.error}`);
        setError(data.error || "Unknown error occurred");
        setProgress(100);
        setStatusMessage("Error occurred");
      }
    } catch (err) {
      clearInterval(progressInterval);
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch pets";
      addLog(`Fetch error: ${errorMsg}`);
      setError(errorMsg);
      setProgress(100);
    } finally {
      setIsLoading(false);
    }
  };

  // If not loading and no error, hide the component
  if (!isLoading && !error && isDone) {
    return null;
  }

  // If scrape was skipped (already attempted), hide
  if (!isLoading && !error && !isDone) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 text-center">
        {/* Debug Toggle */}
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
        >
          {showDebug ? "Hide" : "Show"} Debug Logs
        </button>

        {/* Animated Paw Prints */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="animate-bounce text-3xl" style={{ animationDelay: "0s" }}>🐾</div>
          <div className="animate-bounce text-4xl" style={{ animationDelay: "0.2s" }}>🐾</div>
          <div className="animate-bounce text-3xl" style={{ animationDelay: "0.4s" }}>🐾</div>
        </div>

        {/* Main Icon */}
        <div className="relative mb-6">
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-200">
            <span className="text-7xl">{isDone && !error ? "🎉" : error ? "😿" : "🐕"}</span>
          </div>
          {isLoading && !error && (
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
          {error ? "Oops!" : isDone ? "Pets Found!" : "Loading Pets"}
        </h1>
        <p className="text-orange-600 text-lg mb-8">
          {error 
            ? "Something went wrong while fetching pets"
            : isDone 
            ? `We found ${petsFound} adoptable pets!`
            : "Please wait while we fetch the latest pets from LA County shelters"
          }
        </p>

        {/* Progress Bar */}
        <div className="bg-orange-100 rounded-full h-6 mb-4 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isDone && !error
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
          <span>{isDone || error ? "Done" : "~90 seconds total"}</span>
        </div>

        {/* Status Message */}
        <p className={`text-lg font-medium ${error ? "text-red-500" : isDone ? "text-green-600" : "text-orange-500"}`}>
          {statusMessage}
        </p>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm text-left">
            <p className="text-red-700 font-medium mb-2">❌ Error Details:</p>
            <p className="text-red-600 text-sm font-mono">{error}</p>
            <button 
              onClick={() => {
                sessionStorage.removeItem('lastScrapeAttempt');
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
            >
              🔄 Try Again
            </button>
            <button 
              onClick={() => setIsLoading(false)}
              className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              ✕ Close & View Site
            </button>
          </div>
        )}

        {/* Debug Logs */}
        {showDebug && (
          <div className="mt-6 p-4 bg-gray-900 rounded-xl text-left max-h-48 overflow-y-auto">
            <p className="text-green-400 font-mono text-xs mb-2">Debug Logs:</p>
            {debugLogs.map((log, i) => (
              <p key={i} className="text-gray-300 font-mono text-xs">{log}</p>
            ))}
            {debugLogs.length === 0 && (
              <p className="text-gray-500 font-mono text-xs">No logs yet...</p>
            )}
          </div>
        )}

        {/* Success - auto reload */}
        {isDone && !error && petsFound > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <p className="text-green-700 font-medium">
              ✅ Loading results... Page will refresh automatically!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
