"use client";

import { Pet } from "@/types/pet";
import PetCard from "./PetCard";

interface PetGridProps {
  pets: Pet[];
  isLoading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-lg border border-primary-50 overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-50" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-6 w-24 bg-primary-100 rounded" />
              <div className="h-5 w-14 bg-primary-100 rounded-full" />
            </div>
            <div className="h-4 w-32 bg-primary-50 rounded" />
            <div className="flex gap-1.5">
              <div className="h-5 w-12 bg-primary-50 rounded" />
              <div className="h-5 w-14 bg-primary-50 rounded" />
            </div>
            <div className="pt-3 border-t border-primary-100 space-y-2">
              <div className="h-3 w-36 bg-primary-50 rounded" />
              <div className="h-3 w-24 bg-primary-50 rounded" />
            </div>
            <div className="h-10 w-full bg-primary-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-primary-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="font-display text-xl font-semibold text-primary-900 mb-2">
        No pets found
      </h3>
      <p className="text-primary-600 max-w-md mx-auto">
        Try adjusting your search filters or check back later. New pets are
        added daily!
      </p>
    </div>
  );
}

export default function PetGrid({ pets, isLoading }: PetGridProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!pets || pets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pets.map((pet, index) => (
        <PetCard key={pet.id} pet={pet} index={index} />
      ))}
    </div>
  );
}

