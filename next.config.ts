import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "daccanimalimagesprod.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "animalcare.lacounty.gov",
      },
      {
        protocol: "https",
        hostname: "www.laanimalservices.com",
      },
      {
        protocol: "https",
        hostname: "spcala.com",
      },
      {
        protocol: "https",
        hostname: "*.spcala.com",
      },
      {
        protocol: "https",
        hostname: "pasadenahumane.org",
      },
      {
        protocol: "https",
        hostname: "bestfriends.org",
      },
      {
        protocol: "https",
        hostname: "*.petfinder.com",
      },
    ],
  },
};

export default nextConfig;
