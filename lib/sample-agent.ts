import { getDateRange, makeId, nowIso } from "@/lib/date";
import { getDestinationPreset } from "@/lib/destination-presets";
import type { LivePlaceCandidate } from "@/lib/live-places";
import type { Alert, AgentQuestion, ItineraryDay, ItineraryItem, SourceLink, Trip, TripDraft } from "@/lib/types";

function mapLink(destination: string, place: string): SourceLink {
  const query = encodeURIComponent(`${destination} ${place}`);
  return {
    label: "지도에서 확인",
    url: `https://www.google.com/maps/search/?api=1&query=${query}`,
    checkedAt: nowIso(),
    kind: "map"
  };
}

function searchLink(destination: string, place: string, topic = "영업시간"): SourceLink {
  const query = encodeURIComponent(`${destination} ${place} ${topic}`);
  return {
    label: `${topic} 검색`,
    url: `https://www.google.com/search?q=${query}`,
    checkedAt: nowIso(),
    kind: "web"
  };
}

function weatherLink(destination: string): SourceLink {
  return {
    label: "날씨 예보 검색",
    url: `https://www.google.com/search?q=${encodeURIComponent(`${destination} 날씨 예보`)}`,
    checkedAt: nowIso(),
    kind: "weather"
  };
}

function createItem(
  destination: string,
  time: string,
  placeName: string,
  description: string,
  move: string,
  estimatedCost: string,
  reservationNeeded = false,
  meal?: string
): ItineraryItem {
  return {
    id: makeId("item"),
    time,
    placeName,
    description,
    move,
    meal,
    estimatedCost,
    reservationNeeded,
    sourceLinks: [mapLink(destination, placeName), searchLink(destination, placeName)]
  };
}

const dayThemes = [
  { area: "도착/중심지", fallback: "대표 중심지", morning: "도착 후 중심지 산책", afternoon: "랜드마크와 주변 골목", evening: "첫날 저녁과 야경" },
  { area: "역사/로컬", fallback: "역사 지구", morning: "역사 지구", afternoon: "현지 시장과 골목", evening: "로컬 맛집 거리" },
  { area: "전시/쇼핑", fallback: "전시관 또는 미술관", morning: "전시관 또는 미술관", afternoon: "쇼핑 거리", evening: "예약 식당 후보" },
  { area: "자연/전망", fallback: "전망 좋은 산책로", morning: "공원과 전망 포인트", afternoon: "카페와 휴식 구역", evening: "강변 또는 야경 산책" },
  { area: "근교/특색 지역", fallback: "근교 특색 지역", morning: "근교 특색 지역", afternoon: "지역 명물 거리", evening: "숙소 근처 가벼운 저녁" }
];

function uniquePick(candidates: string[], used: Set<string>, fallback: string) {
  const picked = candidates.find((candidate) => candidate && !used.has(candidate));
  const value = picked || fallback;
  used.add(value);
  return value;
}

function isNightPlace(place: string) {
  return ["도톤보리", "야경", "스카이", "타워", "피크", "대당불야성", "와이탄", "광안리"].some((keyword) => place.includes(keyword));
}

function isFoodPlace(place: string) {
  return ["시장", "맛집", "식당", "야시장", "포장마차", "먹자", "요코초", "차이나타운"].some((keyword) => place.includes(keyword));
}

function pickConcretePlace(candidates: string[], usedPlaces: Set<string>, fallback: string, mode: "day" | "night" | "food" = "day") {
  const filtered = candidates.filter(Boolean).filter((place) => {
    if (usedPlaces.has(place)) return false;
    if (mode === "night") return isNightPlace(place);
    if (mode === "food") return isFoodPlace(place);
    return !isNightPlace(place);
  });

  return uniquePick(filtered.length ? filtered : candidates.filter(Boolean), usedPlaces, fallback);
}

function dayTemplate(destination: string, dayIndex: number, pace: TripDraft["pace"], mustVisits: string[], usedPlaces: Set<string>, areaName: string, foodAreas: string[]): ItineraryItem[] {
  const relaxed = pace === "여유롭게";
  const concretePlaces = mustVisits.filter((place) => !place.includes("확인 필요"));
  const featured = pickConcretePlace([concretePlaces[dayIndex], concretePlaces[dayIndex + 1], ...concretePlaces], usedPlaces, `${destination} 실제 장소 추가 필요`, "day");
  const lunchArea = foodAreas[dayIndex % Math.max(foodAreas.length, 1)] || areaName || featured;
  const lunch = uniquePick([`${lunchArea} 식당 후보`], usedPlaces, `${destination} 식당 후보 확인 필요`);
  const afternoon = pickConcretePlace([concretePlaces[dayIndex + 2], concretePlaces[dayIndex + 3], ...concretePlaces], usedPlaces, `${areaName} 오후 후보 확인 필요`, "day");
  const evening = pickConcretePlace([concretePlaces[dayIndex + 4], ...concretePlaces], usedPlaces, `${areaName} 저녁 후보 확인 필요`, "night");

  if (relaxed) {
    return [
      createItem(destination, "10:00", featured, "선택한 후보를 중심으로 하루를 급하게 시작하지 않고 깊게 둘러봅니다.", "숙소에서 대중교통 또는 택시로 20-35분", "입장료 확인 필요"),
      createItem(destination, "12:30", lunch, "이동을 줄이기 위해 오전 동선 근처에서 점심을 잡습니다.", "도보 10분 이내", "1인 20,000-45,000원", false, "지역 대표 메뉴"),
      createItem(destination, "15:00", afternoon, "휴식 시간을 넣어 체력 부담을 낮추고 날씨가 나쁘면 실내 카페나 전시로 대체합니다.", "도보 또는 짧은 택시 이동", "1인 10,000-25,000원"),
      createItem(destination, "18:00", evening, "예약 가능한 식당을 우선 확인하고 숙소 복귀가 쉬운 지역으로 잡습니다.", "대중교통 15-25분", "1인 30,000-70,000원", true, "예약 권장")
    ];
  }

  return [
    createItem(destination, "09:00", featured, "선택한 장소를 오전에 배치해 혼잡을 줄이고 사진 찍기 좋은 시간을 노립니다.", "대중교통 20-40분", "입장료 확인 필요"),
    createItem(destination, "11:30", `${areaName} 주변 산책`, "장소명이 모호한 골목 탐방 대신 해당 구역 주변의 카페, 상점, 산책 동선을 확인합니다.", "도보 10-20분", "선택 지출"),
    createItem(destination, "13:00", lunch, "웨이팅이 길면 근처 2순위 식당으로 바꾸기 쉽게 잡습니다.", "도보 10분 이내", "1인 20,000-50,000원", false, "현지 인기 메뉴"),
    createItem(destination, "15:00", afternoon, "날씨에 따라 실내/야외를 바꿀 수 있는 오후 일정입니다.", "대중교통 15-30분", "1인 10,000-35,000원"),
    createItem(destination, "19:00", evening, "식사 후 야경이나 산책을 붙여 하루 마무리 만족도를 높입니다.", "대중교통 20분 내외", "1인 30,000-80,000원", true, "예약 권장")
  ];
}

export function buildFallbackTrip(draft: TripDraft, livePlaces?: LivePlaceCandidate[]): Trip {
  const dates = getDateRange(draft.startDate, draft.endDate);
  const mustVisits = draft.mustVisits.split(",").map((item) => item.trim()).filter(Boolean);
  const interests = draft.interests.split(",").map((item) => item.trim()).filter(Boolean);
  const checkedAt = nowIso();
  const usedPlaces = new Set<string>();
  const preset = getDestinationPreset(draft.destination);
  const recommendedMustVisits = [...mustVisits, ...preset.mustVisits].filter(Boolean);
  const foodPreferences = draft.food.split(",").map((item) => item.trim()).filter(Boolean);
  const livePlaceMap = new Map((livePlaces ?? []).map((place) => [place.name, place]));

  const days: ItineraryDay[] = dates.map((date, index) => ({
    id: makeId("day"),
    date,
    area: `${draft.destination} ${preset.dayAreas[index % preset.dayAreas.length] || `${index + 1}일차`}`,
    weatherSummary: "여행 날짜가 가까워지면 최신 예보를 다시 확인하세요. 장기 예보는 변동 가능성이 큽니다.",
    items: dayTemplate(
      draft.destination,
      index,
      draft.pace,
      recommendedMustVisits,
      usedPlaces,
      preset.dayAreas[index % preset.dayAreas.length] || `${draft.destination} ${index + 1}일차`,
      [...foodPreferences, ...preset.foodAreas]
    ).map((item) => {
      const livePlace = livePlaceMap.get(item.placeName);
      const liveSource = livePlace?.url
        ? [
            {
              label: `Google 평점 ${livePlace.rating.toFixed(1)} (${livePlace.userRatingCount.toLocaleString("ko-KR")}개)`,
              url: livePlace.url,
              checkedAt,
              kind: "map" as const
            }
          ]
        : [];

      return {
        ...item,
        estimatedCost: livePlace ? "장소 상세에서 최신 비용 확인" : item.estimatedCost,
        sourceLinks: [...liveSource, ...item.sourceLinks, weatherLink(draft.destination)]
      };
    })
  }));

  const agentQuestions: AgentQuestion[] = [
    {
      id: makeId("question"),
      reason: "항공권과 숙소 가격은 웹 검색만으로 실시간 재고와 최종 금액을 보장하기 어렵습니다.",
      question: "정확한 가격/예약 가능 여부 확인을 위해 항공·숙소 API 연동으로 확장할까요?",
      options: ["지금은 일정만 설계", "항공 API 우선 검토", "숙소 API 우선 검토"]
    }
  ];

  const alerts: Alert[] = [
    {
      id: makeId("alert"),
      type: "weather",
      title: "날씨 재확인 필요",
      message: "출발 7일 전부터 날씨 예보를 다시 확인하고 비 오는 날 대안을 자동 제안하세요.",
      checked: false
    },
    {
      id: makeId("alert"),
      type: "booking",
      title: "예약 권장 항목",
      message: "저녁 식사와 인기 전시는 예약 가능 여부를 먼저 확인하면 일정 변경 리스크가 줄어듭니다.",
      checked: false
    },
    {
      id: makeId("alert"),
      type: "api",
      title: livePlaces?.length ? "실시간 장소 후보 반영" : "API 연동 후보",
      message: livePlaces?.length
        ? "Google Places API의 평점과 후기 수를 참고해 장소 후보를 우선 배치했습니다."
        : "Google Places API 키를 연결하면 어느 도시든 평점과 후기 수 기반 추천을 사용할 수 있습니다.",
      checked: false
    }
  ];

  return {
    id: makeId("trip"),
    title: `${draft.destination} ${dates.length}일 여행`,
    destination: draft.destination,
    startDate: draft.startDate,
    endDate: draft.endDate,
    travelers: draft.travelers,
    budget: draft.budget,
    language: "ko",
    currency: "KRW",
    mustVisits,
    preference: {
      pace: draft.pace,
      interests,
      food: draft.food,
      avoid: draft.avoid
    },
    days,
    agentQuestions,
    alerts,
    createdAt: checkedAt,
    updatedAt: checkedAt
  };
}

export function reviseTrip(trip: Trip, request: string): Trip {
  const lower = request.toLowerCase();
  const relaxed = request.includes("덜 걷") || request.includes("여유") || request.includes("부모님");
  const foodFocused = request.includes("맛집") || request.includes("음식") || request.includes("먹");
  const rainy = request.includes("비") || request.includes("우천") || request.includes("날씨");
  const removeDuplicates = request.includes("중복") || request.includes("같은 장소");
  const usedPlaces = new Set<string>();

  const days = trip.days.map((day) => ({
    ...day,
    weatherSummary: rainy
      ? "비가 오면 야외 일정을 줄이고 박물관, 쇼핑몰, 카페처럼 실내 대안을 우선하세요."
      : day.weatherSummary,
    items: day.items.map((item, index) => {
      const theme = dayThemes[index % dayThemes.length];
      const uniquePlaceName =
        removeDuplicates && usedPlaces.has(item.placeName)
          ? uniquePick([`${day.area} 대체 후보`, theme.afternoon, theme.evening], usedPlaces, "대체 일정")
          : item.placeName;

      usedPlaces.add(uniquePlaceName);

      if (relaxed && index > 2) {
        return {
          ...item,
          placeName: uniquePlaceName,
          time: index === 3 ? "17:30" : item.time,
          move: "택시 또는 환승 적은 대중교통 우선",
          description: `${item.description} 이동 부담을 줄이도록 동선을 짧게 조정했습니다.`
        };
      }

      if (foodFocused && (item.meal || item.placeName.includes("식당"))) {
        return {
          ...item,
          placeName: uniquePlaceName,
          reservationNeeded: true,
          description: `${item.description} 현지 인기 식당 2-3곳을 비교하고 예약 가능한 곳을 우선합니다.`
        };
      }

      return { ...item, placeName: uniquePlaceName };
    })
  }));

  const alert: Alert = {
    id: makeId("alert"),
    type: lower.includes("api") ? "api" : rainy ? "weather" : "hours",
    title: "수정 요청 반영",
    message: `"${request}" 요청을 일정에 반영했습니다. 정확한 영업시간과 예약 가능 여부는 출발 전 다시 확인하세요.`,
    checked: false
  };

  return {
    ...trip,
    preference: relaxed ? { ...trip.preference, pace: "여유롭게" } : trip.preference,
    days,
    alerts: [alert, ...trip.alerts],
    updatedAt: nowIso()
  };
}
