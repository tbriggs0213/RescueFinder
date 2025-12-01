import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const shelters = await prisma.shelter.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        website: true,
        adoptionUrl: true,
        phone: true,
        email: true,
        street: true,
        city: true,
        state: true,
        postcode: true,
        latitude: true,
        longitude: true,
        lastScraped: true,
        _count: {
          select: {
            pets: {
              where: { isAvailable: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      shelters: shelters.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        website: s.website,
        adoptionUrl: s.adoptionUrl,
        phone: s.phone,
        email: s.email,
        address: {
          street: s.street,
          city: s.city,
          state: s.state,
          postcode: s.postcode,
        },
        location: s.latitude && s.longitude ? {
          lat: s.latitude,
          lng: s.longitude,
        } : null,
        lastScraped: s.lastScraped,
        activePets: s._count.pets,
      })),
    });
  } catch (error) {
    console.error("Error fetching shelters:", error);
    return NextResponse.json({ error: "Failed to fetch shelters" }, { status: 500 });
  }
}

