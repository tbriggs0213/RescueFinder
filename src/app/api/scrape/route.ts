import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers, runScraper, initializeShelters } from "@/lib/scrapers";

// API route to trigger scraping
// In production, this would be called by a cron job or scheduled task

export async function POST(request: NextRequest) {
  // Check for API key in production
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.SCRAPE_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const scraperKey = body.scraper as string | undefined;

    // Initialize shelters first
    await initializeShelters();

    let results;
    if (scraperKey) {
      // Run specific scraper
      results = await runScraper(scraperKey);
    } else {
      // Run all scrapers
      results = await runAllScrapers();
    }

    // Calculate summary
    const summary = {
      totalShelters: results.length,
      successfulShelters: results.filter((r) => r.success).length,
      totalPetsFound: results.reduce((sum, r) => sum + r.pets.length, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      results: results.map((r) => ({
        shelter: r.shelterName,
        success: r.success,
        petsFound: r.pets.length,
        duration: r.duration,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scraping status
export async function GET() {
  try {
    // Get recent scrape logs
    const { default: prisma } = await import("@/lib/db");
    
    const recentLogs = await prisma.scrapeLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const shelters = await prisma.shelter.findMany({
      select: {
        id: true,
        name: true,
        lastScraped: true,
        _count: {
          select: { pets: { where: { isAvailable: true } } },
        },
      },
    });

    return NextResponse.json({
      shelters: shelters.map((s) => ({
        name: s.name,
        lastScraped: s.lastScraped,
        activePets: s._count.pets,
      })),
      recentLogs: recentLogs.map((log) => ({
        shelter: log.shelterName,
        status: log.status,
        petsFound: log.petsFound,
        petsAdded: log.petsAdded,
        petsUpdated: log.petsUpdated,
        petsRemoved: log.petsRemoved,
        duration: log.duration,
        error: log.errorMessage,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching scrape status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}

