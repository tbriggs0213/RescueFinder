import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const species = searchParams.get("species") || undefined;
  const breed = searchParams.get("breed") || undefined;
  const age = searchParams.get("age") || undefined;
  const size = searchParams.get("size") || undefined;
  const gender = searchParams.get("gender") || undefined;
  const shelterId = searchParams.get("shelter") || undefined;
  
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  try {
    // Build where clause
    const where: any = {
      isAvailable: true,
    };

    if (species) where.species = species;
    if (breed) where.breed = { contains: breed };
    if (age) where.age = age;
    if (size) where.size = size;
    if (gender) where.gender = gender;
    if (shelterId) where.shelterId = shelterId;

    // Get total count
    const totalCount = await prisma.pet.count({ where });

    // Get pets with photos and shelter info
    const pets = await prisma.pet.findMany({
      where,
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        shelter: true,
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    });

    // Transform to match expected format
    const transformedPets = pets.map((pet) => {
      // Calculate days in shelter
      const publishedDate = new Date(pet.publishedAt);
      const now = new Date();
      const daysInShelter = Math.floor(
        (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        breedSecondary: pet.breedSecondary,
        age: pet.age,
        gender: pet.gender,
        size: pet.size,
        description: pet.description,
        photos: pet.photos.map((p) => ({
          small: p.url,
          medium: p.url,
          large: p.url,
          full: p.url,
        })),
        status: pet.status,
        attributes: {
          spayedNeutered: pet.spayedNeutered,
          houseTrained: pet.houseTrained,
          specialNeeds: pet.specialNeeds,
          shotsCurrent: pet.shotsCurrent,
          goodWithChildren: pet.goodWithChildren ?? false,
          goodWithDogs: pet.goodWithDogs ?? false,
          goodWithCats: pet.goodWithCats ?? false,
        },
        shelter: {
          id: pet.shelter.id,
          name: pet.shelter.name,
          email: pet.shelter.email,
          phone: pet.shelter.phone,
          address: {
            street: pet.shelter.street,
            city: pet.shelter.city,
            state: pet.shelter.state,
            postcode: pet.shelter.postcode || "",
            country: "US",
          },
          website: pet.shelter.website,
        },
        daysInShelter,
        adoptionUrl: pet.adoptionUrl || pet.shelter.adoptionUrl || pet.shelter.website || "",
        publishedAt: pet.publishedAt.toISOString(),
      };
    });

    return NextResponse.json({
      pets: transformedPets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching pets:", error);
    return NextResponse.json(
      { error: "Failed to fetch pets", pets: [], pagination: { currentPage: 1, totalPages: 0, totalCount: 0 } },
      { status: 500 }
    );
  }
}
