export type TravelerPreference = {
  pace: "여유롭게" | "보통" | "알차게";
  interests: string[];
  food: string;
  avoid: string;
};

export type SourceLink = {
  label: string;
  url: string;
  checkedAt: string;
  kind: "web" | "map" | "weather" | "user";
};

export type ItineraryItem = {
  id: string;
  time: string;
  placeName: string;
  localName?: string;
  description: string;
  move: string;
  meal?: string;
  estimatedCost: string;
  reservationNeeded: boolean;
  sourceLinks: SourceLink[];
};

export type ItineraryDay = {
  id: string;
  date: string;
  area: string;
  weatherSummary: string;
  items: ItineraryItem[];
};

export type AgentQuestion = {
  id: string;
  reason: string;
  question: string;
  options: string[];
};

export type Alert = {
  id: string;
  type: "weather" | "hours" | "booking" | "api";
  title: string;
  message: string;
  relatedItemId?: string;
  checked: boolean;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  language: "ko";
  currency: string;
  mustVisits: string[];
  preference: TravelerPreference;
  days: ItineraryDay[];
  agentQuestions: AgentQuestion[];
  alerts: Alert[];
  createdAt: string;
  updatedAt: string;
};

export type TripDraft = {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  pace: TravelerPreference["pace"];
  interests: string;
  food: string;
  avoid: string;
  mustVisits: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
