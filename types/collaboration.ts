export type CollaboratorRole = "owner" | "editor" | "viewer";

export type Collaborator = {
  id: string;
  name: string | null;
  email: string;
  role: CollaboratorRole;
};

export type TripInvitation = {
  id: string;
  tripId: string;
  email: string;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};
