export function nowIso() {
  return new Date().toISOString();
}

export function formatKoreanDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${date}T12:00:00`));
}

export function getDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const dates: string[] = [];

  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    dates.push(day.toISOString().slice(0, 10));
  }

  return dates.length ? dates : [startDate];
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}
