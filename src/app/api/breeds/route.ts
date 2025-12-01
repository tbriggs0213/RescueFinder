import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const species = searchParams.get("species");

  if (!species) {
    return NextResponse.json({ breeds: [] });
  }

  try {
    // Get distinct breeds from the database
    const pets = await prisma.pet.findMany({
      where: {
        species,
        isAvailable: true,
      },
      select: {
        breed: true,
      },
      distinct: ["breed"],
      orderBy: {
        breed: "asc",
      },
    });

    const breeds = pets
      .map((p) => p.breed)
      .filter((b) => b && b !== "Unknown" && b !== "Mixed Breed");

    return NextResponse.json({ breeds });
  } catch (error) {
    console.error("Error fetching breeds:", error);
    return NextResponse.json({ breeds: [] });
  }
}
