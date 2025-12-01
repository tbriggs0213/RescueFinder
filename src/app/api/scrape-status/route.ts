import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get total pet count
    const petCount = await prisma.pet.count({
      where: { isAvailable: true },
    });

    // Get last scrape time from any shelter
    const lastScrape = await prisma.scrapeLog.findFirst({
      where: { status: "success" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Check if data is stale (more than 6 hours old)
    let isStale = false;
    if (lastScrape) {
      const hoursSinceLastScrape = 
        (Date.now() - lastScrape.createdAt.getTime()) / (1000 * 60 * 60);
      isStale = hoursSinceLastScrape > 6;
    }

    return NextResponse.json({
      petCount,
      lastScrapedAt: lastScrape?.createdAt?.toISOString() || null,
      needsScrape: petCount === 0 || isStale,
      isStale,
    });
  } catch (error) {
    console.error("Error checking scrape status:", error);
    return NextResponse.json({
      petCount: 0,
      lastScrapedAt: null,
      needsScrape: true,
      isStale: true,
    });
  }
}

