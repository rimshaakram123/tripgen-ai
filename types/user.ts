export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type UserProfile = SafeUser & {
  hasTravelDNA: boolean;
  tripCount: number;
};
