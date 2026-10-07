import type { DNAQuestion } from "@/types/travelDNA";

export const questions: DNAQuestion[] = [
  {
    id: 1,
    question: "What type of activities excite you most?",
    options: [
      { text: "Hiking, climbing and outdoor adventure", category: "adventure" },
      { text: "Museums, history and ancient architecture", category: "culture" },
      { text: "Beaches, forests and natural landscapes", category: "nature" },
    ],
  },
  {
    id: 2,
    question: "What is your ideal travel pace?",
    options: [
      { text: "Slow mornings, spa days and pure relaxation", category: "relaxation" },
      { text: "Pack every day with new experiences", category: "adventure" },
      { text: "Find the best angles and capture every moment", category: "photography" },
    ],
  },
  {
    id: 3,
    question: "What attracts you most about a destination?",
    options: [
      { text: "Street food markets and local cuisine", category: "food" },
      { text: "Bars, clubs and nightlife scenes", category: "nightlife" },
      { text: "Traditional ceremonies and cultural heritage", category: "culture" },
    ],
  },
  {
    id: 4,
    question: "How do you approach your travel budget?",
    options: [
      { text: "I plan and track every expense carefully", category: "budget" },
      { text: "Money is no object for unforgettable experiences", category: "adventure" },
      { text: "I look for hidden gems and local value", category: "food" },
    ],
  },
  {
    id: 5,
    question: "Your perfect evening abroad looks like...",
    options: [
      { text: "A sunset hike or night safari", category: "adventure" },
      { text: "A fine-dining experience with local wine", category: "food" },
      { text: "A rooftop bar with city skyline views", category: "nightlife" },
    ],
  },
  {
    id: 6,
    question: "What do you bring home from every trip?",
    options: [
      { text: "A camera full of stunning photographs", category: "photography" },
      { text: "Stories of local people and traditions", category: "culture" },
      { text: "Peace of mind and renewed energy", category: "relaxation" },
    ],
  },
];
