export type TripStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

import type { Itinerary } from "@/types/itinerary";

export type Trip = {
  id: string;
  userId: string;
  destination: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  budget?: number | null;
  currency: string;
  coverImage?: string | null;
  status: TripStatus;
  itinerary?: Itinerary | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTripInput = {
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  coverImage?: string;
};

export type UpdateTripInput = Partial<CreateTripInput> & {
  status?: TripStatus;
  itinerary?: Itinerary;
};
