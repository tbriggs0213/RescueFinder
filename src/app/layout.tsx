import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RescueFinder | Find Your Perfect Rescue Pet in LA County",
  description:
    "Discover adoptable dogs, cats, and other pets from shelters and rescues across Los Angeles County. Search by breed, age, and location to find your new best friend.",
  keywords: [
    "pet adoption",
    "rescue pets",
    "Los Angeles",
    "LA County",
    "animal shelter",
    "adopt a dog",
    "adopt a cat",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} antialiased font-body`}
      >
        {children}
      </body>
    </html>
  );
}

