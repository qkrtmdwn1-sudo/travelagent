export type DestinationPreset = {
  match: string[];
  neighborhoods: string[];
  mustVisits: string[];
  foodAreas: string[];
  rainyOptions: string[];
  dayAreas: string[];
};

export const destinationPresets: DestinationPreset[] = [
  {
    match: ["도쿄", "tokyo", "東京"],
    neighborhoods: ["시부야", "신주쿠", "아사쿠사", "긴자", "우에노", "다이칸야마", "오모테산도", "롯폰기"],
    mustVisits: ["시부야 스카이", "센소지", "긴자", "우에노 공원", "도쿄역", "메이지 신궁"],
    foodAreas: ["츠키지 장외시장", "신주쿠 오모이데요코초", "긴자", "에비스", "가구라자카"],
    rainyOptions: ["도쿄국립박물관", "모리미술관", "긴자 쇼핑", "팀랩 플래닛", "도쿄역 지하상가"],
    dayAreas: ["시부야/하라주쿠", "아사쿠사/우에노", "긴자/도쿄역", "롯폰기/오모테산도", "다이칸야마/에비스"]
  },
  {
    match: ["오사카", "osaka", "大阪"],
    neighborhoods: ["난바", "도톤보리", "우메다", "신세카이", "나카자키초", "덴노지", "교토 당일치기"],
    mustVisits: ["도톤보리", "오사카성", "우메다 스카이빌딩", "구로몬시장", "신세카이"],
    foodAreas: ["도톤보리", "구로몬시장", "신세카이", "우메다", "덴마"],
    rainyOptions: ["아베노 하루카스", "그랜드 프론트 오사카", "오사카 역사박물관", "난바 파크스"],
    dayAreas: ["난바/도톤보리", "우메다/나카자키초", "오사카성/덴마", "신세카이/덴노지", "교토 또는 고베 근교"]
  },
  {
    match: ["후쿠오카", "fukuoka", "福岡"],
    neighborhoods: ["하카타", "텐진", "나카스", "오호리공원", "다자이후", "모모치해변"],
    mustVisits: ["오호리공원", "다자이후 텐만구", "캐널시티", "후쿠오카 타워", "나카스 포장마차"],
    foodAreas: ["하카타역", "텐진", "나카스", "야쿠인", "이마이즈미"],
    rainyOptions: ["캐널시티", "하카타역 쇼핑", "후쿠오카시 박물관", "텐진 지하상가"],
    dayAreas: ["하카타/캐널시티", "텐진/나카스", "오호리/모모치", "다자이후", "야쿠인/이마이즈미"]
  },
  {
    match: ["제주", "jeju", "제주도"],
    neighborhoods: ["제주시", "애월", "한림", "서귀포", "성산", "중문", "표선"],
    mustVisits: ["성산일출봉", "우도", "협재해변", "천지연폭포", "오설록", "새별오름"],
    foodAreas: ["동문시장", "애월 카페거리", "서귀포 매일올레시장", "성산", "중문"],
    rainyOptions: ["아르떼뮤지엄", "오설록", "본태박물관", "빛의 벙커", "동문시장"],
    dayAreas: ["제주시/동문시장", "애월/한림", "서귀포/중문", "성산/우도", "오름/숲길"]
  },
  {
    match: ["파리", "paris"],
    neighborhoods: ["마레", "생제르맹", "몽마르트르", "루브르", "에펠탑", "라탱지구", "오페라"],
    mustVisits: ["루브르", "에펠탑", "오르세 미술관", "몽마르트르", "노트르담 주변", "튈르리 정원"],
    foodAreas: ["마레", "생제르맹", "몽마르트르", "바스티유", "오페라"],
    rainyOptions: ["루브르", "오르세 미술관", "오페라 가르니에", "갤러리 라파예트", "퐁피두 센터"],
    dayAreas: ["루브르/마레", "에펠탑/생제르맹", "몽마르트르/오페라", "오르세/튈르리", "베르사유 근교"]
  }
];

export const genericPreset: DestinationPreset = {
  match: [],
  neighborhoods: ["중심가", "역사 지구", "현지 시장", "전망 좋은 구역", "카페 거리", "강변 또는 해변"],
  mustVisits: ["대표 랜드마크", "현지 시장", "박물관 또는 미술관", "전망 포인트", "산책하기 좋은 거리"],
  foodAreas: ["중심가 맛집 거리", "현지 시장", "숙소 근처 식당가", "카페 거리"],
  rainyOptions: ["대표 박물관", "실내 쇼핑몰", "카페", "전시 공간", "시장"],
  dayAreas: ["중심가", "역사 지구", "전시/쇼핑 구역", "자연/전망 구역", "근교"]
};

export function getDestinationPreset(destination: string) {
  const normalized = destination.trim().toLowerCase();
  return destinationPresets.find((preset) => preset.match.some((item) => normalized.includes(item.toLowerCase()))) ?? genericPreset;
}
