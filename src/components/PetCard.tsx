"use client";

import Image from "next/image";
import { useState } from "react";
import { Pet } from "@/types/pet";

interface PetCardProps {
  pet: Pet;
  index?: number;
}

export default function PetCard({ pet, index = 0 }: PetCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const hasPhotos = pet.photos && pet.photos.length > 0;
  const currentPhoto = hasPhotos ? pet.photos[currentPhotoIndex] : null;
  const photoUrl = currentPhoto?.large || currentPhoto?.medium || "";

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % pet.photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPhotos) {
      setCurrentPhotoIndex(
        (prev) => (prev - 1 + pet.photos.length) % pet.photos.length
      );
    }
  };

  const getAgeColor = (age: string) => {
    switch (age) {
      case "Baby":
        return "bg-pink-100 text-pink-700";
      case "Young":
        return "bg-green-100 text-green-700";
      case "Adult":
        return "bg-blue-100 text-blue-700";
      case "Senior":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return "New today!";
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  return (
    <div
      className={`group bg-white rounded-2xl shadow-lg shadow-primary-100/30 border border-primary-50 overflow-hidden hover:shadow-xl hover:shadow-primary-200/40 hover:-translate-y-1 transition-all duration-300 opacity-0 animate-fade-in`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
        {hasPhotos && photoUrl && !imageError ? (
          <>
            <Image
              src={photoUrl}
              alt={`Photo of ${pet.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
            
            {/* Photo navigation */}
            {pet.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
                >
                  <svg
                    className="w-4 h-4 text-primary-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
                >
                  <svg
                    className="w-4 h-4 text-primary-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                
                {/* Photo indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {pet.photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentPhotoIndex
                          ? "bg-white w-3"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-primary-200 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-primary-300 text-sm mt-2">No photo available</p>
            </div>
          </div>
        )}

        {/* Days in shelter badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-primary-700 shadow-sm">
            {getDaysLabel(pet.daysInShelter)} in shelter
          </span>
        </div>

        {/* Species icon */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            {pet.species === "Dog" ? (
              <span className="text-lg">🐕</span>
            ) : pet.species === "Cat" ? (
              <span className="text-lg">🐈</span>
            ) : pet.species === "Rabbit" ? (
              <span className="text-lg">🐰</span>
            ) : pet.species === "Bird" ? (
              <span className="text-lg">🐦</span>
            ) : (
              <span className="text-lg">🐾</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and Age */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-xl font-bold text-primary-900 leading-tight">
            {pet.name}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getAgeColor(
              pet.age
            )}`}
          >
            {pet.age}
          </span>
        </div>

        {/* Breed */}
        <p className="text-sm text-primary-600 mb-3">
          {pet.breed}
          {pet.breedSecondary && ` & ${pet.breedSecondary}`}
        </p>

        {/* Attributes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2 py-0.5 bg-primary-50 rounded-md text-xs text-primary-600">
            {pet.gender}
          </span>
          <span className="px-2 py-0.5 bg-primary-50 rounded-md text-xs text-primary-600">
            {pet.size}
          </span>
          {pet.attributes.spayedNeutered && (
            <span className="px-2 py-0.5 bg-shelter-50 rounded-md text-xs text-shelter-600">
              Fixed
            </span>
          )}
          {pet.attributes.houseTrained && (
            <span className="px-2 py-0.5 bg-shelter-50 rounded-md text-xs text-shelter-600">
              House Trained
            </span>
          )}
        </div>

        {/* Shelter info */}
        <div className="pt-3 border-t border-primary-100">
          <p className="text-xs text-primary-500 truncate mb-1">
            {pet.shelter.name}
          </p>
          <p className="text-xs text-primary-400">
            {pet.shelter.address.city}, {pet.shelter.address.state}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <a
            href={pet.adoptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl text-center hover:from-primary-600 hover:to-primary-700 transition-all shadow-md shadow-primary-200 hover:shadow-primary-300"
          >
            View & Adopt
          </a>
          {pet.shelter.phone && (
            <a
              href={`tel:${pet.shelter.phone}`}
              className="px-3 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
              title={`Call ${pet.shelter.name}`}
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

