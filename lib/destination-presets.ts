export type DestinationPreset = {
  match: string[];
  label: string;
  neighborhoods: string[];
  mustVisits: string[];
  foodAreas: string[];
  rainyOptions: string[];
  dayAreas: string[];
};

export const destinationPresets: DestinationPreset[] = [
  {
    match: ["도쿄", "tokyo", "東京"],
    label: "도쿄",
    neighborhoods: ["시부야", "신주쿠", "아사쿠사", "긴자", "우에노", "다이칸야마", "오모테산도", "롯폰기"],
    mustVisits: ["시부야 스카이", "센소지", "긴자", "우에노 공원", "도쿄역", "메이지 신궁"],
    foodAreas: ["츠키지 장외시장", "신주쿠 오모이데요코초", "긴자", "에비스", "가구라자카"],
    rainyOptions: ["도쿄국립박물관", "모리미술관", "긴자 쇼핑", "팀랩 플래닛", "도쿄역 지하상가"],
    dayAreas: ["시부야/하라주쿠", "아사쿠사/우에노", "긴자/도쿄역", "롯폰기/오모테산도", "다이칸야마/에비스"]
  },
  {
    match: ["오사카", "osaka", "大阪"],
    label: "오사카",
    neighborhoods: ["난바", "도톤보리", "우메다", "신세카이", "나카자키초", "덴노지", "교토 당일치기"],
    mustVisits: ["도톤보리", "오사카성", "우메다 스카이빌딩", "구로몬시장", "신세카이"],
    foodAreas: ["도톤보리", "구로몬시장", "신세카이", "우메다", "덴마"],
    rainyOptions: ["아베노 하루카스", "그랜드 프론트 오사카", "오사카 역사박물관", "난바 파크스"],
    dayAreas: ["난바/도톤보리", "우메다/나카자키초", "오사카성/덴마", "신세카이/덴노지", "교토 또는 고베 근교"]
  },
  {
    match: ["후쿠오카", "fukuoka", "福岡"],
    label: "후쿠오카",
    neighborhoods: ["하카타", "텐진", "나카스", "오호리공원", "다자이후", "모모치해변"],
    mustVisits: ["오호리공원", "다자이후 텐만구", "캐널시티", "후쿠오카 타워", "나카스 포장마차"],
    foodAreas: ["하카타역", "텐진", "나카스", "야쿠인", "이마이즈미"],
    rainyOptions: ["캐널시티", "하카타역 쇼핑", "후쿠오카시 박물관", "텐진 지하상가"],
    dayAreas: ["하카타/캐널시티", "텐진/나카스", "오호리/모모치", "다자이후", "야쿠인/이마이즈미"]
  },
  {
    match: ["제주", "jeju", "제주도"],
    label: "제주",
    neighborhoods: ["제주시", "애월", "한림", "서귀포", "성산", "중문", "표선"],
    mustVisits: ["성산일출봉", "우도", "협재해변", "천지연폭포", "오설록", "새별오름"],
    foodAreas: ["동문시장", "애월 카페거리", "서귀포 매일올레시장", "성산", "중문"],
    rainyOptions: ["아르떼뮤지엄", "오설록", "본태박물관", "빛의 벙커", "동문시장"],
    dayAreas: ["제주시/동문시장", "애월/한림", "서귀포/중문", "성산/우도", "오름/숲길"]
  },
  {
    match: ["파리", "paris"],
    label: "파리",
    neighborhoods: ["마레", "생제르맹", "몽마르트르", "루브르", "에펠탑", "라탱지구", "오페라"],
    mustVisits: ["루브르", "에펠탑", "오르세 미술관", "몽마르트르", "노트르담 주변", "튈르리 정원"],
    foodAreas: ["마레", "생제르맹", "몽마르트르", "바스티유", "오페라"],
    rainyOptions: ["루브르", "오르세 미술관", "오페라 가르니에", "갤러리 라파예트", "퐁피두 센터"],
    dayAreas: ["루브르/마레", "에펠탑/생제르맹", "몽마르트르/오페라", "오르세/튈르리", "베르사유 근교"]
  }
];

export const genericPreset: DestinationPreset = {
  match: [],
  label: "직접 입력",
  neighborhoods: [],
  mustVisits: [],
  foodAreas: [],
  rainyOptions: [],
  dayAreas: []
};

export function getDestinationPreset(destination: string) {
  const normalized = destination.trim().toLowerCase();
  return destinationPresets.find((preset) => preset.match.some((item) => normalized.includes(item.toLowerCase()))) ?? genericPreset;
}
