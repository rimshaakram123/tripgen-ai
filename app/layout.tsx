import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "TripGen AI | Travel That Adapts To You",
    template: "%s | TripGen AI",
  },
  description:
    "TripGen AI creates personalized, grounded travel journeys using Travel DNA, verified places, weather context, and adaptive AI.",
  keywords: [
    "AI travel planner",
    "personalized itinerary",
    "Travel DNA",
    "adaptive travel",
    "grounded travel planning",
  ],
  authors: [{ name: "TripGen AI" }],
  openGraph: {
    title: "TripGen AI | Travel That Adapts To You",
    description:
      "Discover your Travel DNA and build grounded journeys that adapt to you.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
