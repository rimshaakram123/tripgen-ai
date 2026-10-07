export type DNADimension =
  | "adventure"
  | "culture"
  | "food"
  | "nature"
  | "photography"
  | "relaxation"
  | "nightlife"
  | "budget";

export type TravelDNA = {
  adventure: number;
  culture: number;
  food: number;
  nature: number;
  photography: number;
  relaxation: number;
  nightlife: number;
  budget: number;
  personality?: string;
};

export type DNAQuestionOption = {
  text: string;
  category: DNADimension;
};

export type DNAQuestion = {
  id: number;
  question: string;
  options: DNAQuestionOption[];
};

export type DNAPersonalityType = {
  type: string;
  description: string;
  primaryTraits: DNADimension[];
};
