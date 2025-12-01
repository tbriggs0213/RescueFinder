"use client";

import { useState, useEffect } from "react";

interface ScrapeResult {
  shelter: string;
  success: boolean;
  petsFound: number;
  duration: number;
  error?: string;
}

interface ScrapeResponse {
  success: boolean;
  summary?: {
    totalShelters: number;
    successfulShelters: number;
    totalPetsFound: number;
    totalDuration: number;
  };
  results?: ScrapeResult[];
  error?: string;
}

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResponse | null>(null);

  // Auto-refresh after successful scrape with pets
  useEffect(() => {
    if (results?.success && results.summary?.totalPetsFound && results.summary.totalPetsFound > 0) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [results]);

  const runScrapers = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Failed to run scrapers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-2 z-50"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Admin
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between">
        <h3 className="font-semibold">Admin Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Scrape Button */}
        <div>
          <button
            onClick={runScrapers}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-shelter-500 to-shelter-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
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
                Scraping shelters... (this may take a minute)
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Run Scrapers (Fetch New Pets)
              </>
            )}
          </button>
          <p className="text-xs text-primary-500 mt-2 text-center">
            This will fetch pets from all 20+ LA County shelters
          </p>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            {results.success ? (
              <>
                {/* Summary */}
                <div className="bg-shelter-50 rounded-xl p-3">
                  <h4 className="font-medium text-shelter-800 mb-2">
                    ✅ Scrape Complete
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-shelter-600">Shelters:</span>{" "}
                      <span className="font-medium">
                        {results.summary?.successfulShelters}/
                        {results.summary?.totalShelters}
                      </span>
                    </div>
                    <div>
                      <span className="text-shelter-600">Pets Found:</span>{" "}
                      <span className="font-medium">
                        {results.summary?.totalPetsFound}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-1">
                  <h4 className="font-medium text-primary-800 text-sm">
                    Details:
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.results?.map((r, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded ${
                          r.success
                            ? r.petsFound > 0
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium truncate flex-1">
                            {r.shelter}
                          </span>
                          <span>
                            {r.success ? `${r.petsFound} pets` : "Failed"}
                          </span>
                        </div>
                        {r.error && (
                          <div className="text-red-500 mt-1 truncate">
                            {r.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refresh prompt */}
                <div className="text-center space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                  >
                    🔄 Refresh page to see new pets
                  </button>
                  {results.summary?.totalPetsFound && results.summary.totalPetsFound > 0 && (
                    <p className="text-xs text-green-600 animate-pulse">
                      Auto-refreshing in 3 seconds...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-red-50 rounded-xl p-3">
                <h4 className="font-medium text-red-800 mb-1">❌ Error</h4>
                <p className="text-sm text-red-600">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

