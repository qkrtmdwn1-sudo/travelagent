import type { TripDraft } from "@/lib/types";

type GooglePlace = {
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
};

export type LivePlaceCandidate = {
  name: string;
  address: string;
  url: string;
  rating: number;
  userRatingCount: number;
  location?: {
    lat: number;
    lng: number;
  };
  score: number;
  kind: "attraction" | "food" | "rainy";
};

const fieldMask = [
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types"
].join(",");

function scorePlace(place: GooglePlace) {
  const rating = place.rating ?? 0;
  const count = place.userRatingCount ?? 0;
  return rating * Math.log10(count + 10);
}

async function searchPlaces(textQuery: string, kind: LivePlaceCandidate["kind"]) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return [];

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": fieldMask
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "ko",
      pageSize: 10,
      minRating: 4
    })
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { places?: GooglePlace[] };
  return (data.places ?? [])
    .map((place) => ({
      name: place.displayName?.text ?? "",
      address: place.formattedAddress ?? "",
      url: place.googleMapsUri ?? "",
      rating: place.rating ?? 0,
      userRatingCount: place.userRatingCount ?? 0,
      location:
        typeof place.location?.latitude === "number" && typeof place.location.longitude === "number"
          ? { lat: place.location.latitude, lng: place.location.longitude }
          : undefined,
      score: scorePlace(place),
      kind
    }))
    .filter((place) => place.name)
    .sort((a, b) => b.score - a.score);
}

function uniqueByName(places: LivePlaceCandidate[]) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getLivePlaceCandidates(destination: string) {
  const [attractions, food, rainy] = await Promise.all([
    searchPlaces(`${destination} 인기 관광지 명소`, "attraction"),
    searchPlaces(`${destination} 인기 맛집 시장 카페`, "food"),
    searchPlaces(`${destination} 실내 관광지 박물관 미술관 쇼핑몰`, "rainy")
  ]);

  return {
    attractions: uniqueByName(attractions).slice(0, 8),
    food: uniqueByName(food).slice(0, 6),
    rainy: uniqueByName(rainy).slice(0, 5)
  };
}

export function applyLiveCandidatesToDraft(draft: TripDraft, live: Awaited<ReturnType<typeof getLivePlaceCandidates>>) {
  const userMustVisits = draft.mustVisits.split(",").map((item) => item.trim()).filter(Boolean);
  const userFood = draft.food.split(",").map((item) => item.trim()).filter(Boolean);
  const userInterests = draft.interests.split(",").map((item) => item.trim()).filter(Boolean);

  return {
    ...draft,
    mustVisits: [...userMustVisits, ...live.attractions.map((place) => place.name)].join(", "),
    food: [...userFood, ...live.food.map((place) => place.name)].join(", "),
    interests: [...userInterests, ...live.rainy.map((place) => `우천 대안: ${place.name}`)].join(", ")
  };
}
