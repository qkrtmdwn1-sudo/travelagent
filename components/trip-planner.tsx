"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  MapPin,
  Plane,
  Printer,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Users
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatKoreanDate } from "@/lib/date";
import { destinationPresets, getDestinationPreset } from "@/lib/destination-presets";
import { downloadText, listTrips, makeShareUrl, saveTrip } from "@/lib/storage";
import type { Trip, TripDraft } from "@/lib/types";

const today = new Date();
const defaultStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30).toISOString().slice(0, 10);
const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 33).toISOString().slice(0, 10);

const initialDraft: TripDraft = {
  destination: "도쿄",
  startDate: defaultStart,
  endDate: defaultEnd,
  travelers: 2,
  budget: "1인 120만원",
  pace: "보통",
  interests: "맛집, 산책, 전시, 야경",
  food: "현지 인기 식당과 카페",
  avoid: "너무 긴 도보 이동",
  mustVisits: "시부야 스카이, 아사쿠사, 긴자"
};

const interestOptions = ["맛집", "산책", "전시", "야경", "쇼핑"];
const destinationOptions = destinationPresets.map((preset) => preset.match[0]);

function tripToMarkdown(trip: Trip) {
  const lines = [
    `# ${trip.title}`,
    "",
    `- 목적지: ${trip.destination}`,
    `- 기간: ${trip.startDate} ~ ${trip.endDate}`,
    `- 인원: ${trip.travelers}명`,
    `- 예산: ${trip.budget}`,
    ""
  ];

  trip.days.forEach((day) => {
    lines.push(`## ${formatKoreanDate(day.date)} · ${day.area}`);
    lines.push(`날씨 메모: ${day.weatherSummary}`);
    lines.push("");
    day.items.forEach((item) => {
      lines.push(`- ${item.time} ${item.placeName}`);
      lines.push(`  - ${item.description}`);
      lines.push(`  - 이동: ${item.move}`);
      lines.push(`  - 비용: ${item.estimatedCost}`);
      lines.push(`  - 예약: ${item.reservationNeeded ? "필요/권장" : "선택"}`);
    });
    lines.push("");
  });

  lines.push("## 체크리스트");
  trip.alerts.forEach((alert) => lines.push(`- [ ] ${alert.title}: ${alert.message}`));
  return lines.join("\n");
}

function tripToIcs(trip: Trip) {
  const events = trip.days.flatMap((day) =>
    day.items.map((item) => {
      const cleanTime = item.time.replace(":", "");
      const start = `${day.date.replaceAll("-", "")}T${cleanTime.padEnd(4, "0")}00`;
      return [
        "BEGIN:VEVENT",
        `UID:${item.id}@travel-agent.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${start}`,
        `SUMMARY:${item.placeName}`,
        `DESCRIPTION:${item.description} / 이동: ${item.move} / 비용: ${item.estimatedCost}`,
        "END:VEVENT"
      ].join("\r\n");
    })
  );

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travel Agent MVP//KO", ...events, "END:VCALENDAR"].join("\r\n");
}

export function TripPlanner() {
  const [draft, setDraft] = useState<TripDraft>(initialDraft);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [revision, setRevision] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("목적지와 날짜를 입력하면 새 일정이 생성됩니다.");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["맛집", "산책", "전시", "야경"]);
  const [customInterest, setCustomInterest] = useState("");
  const [selectedMustVisits, setSelectedMustVisits] = useState<string[]>(["시부야 스카이", "아사쿠사", "긴자"]);
  const [customMustVisit, setCustomMustVisit] = useState("");
  const [selectedFoodAreas, setSelectedFoodAreas] = useState<string[]>([]);
  const [customFood, setCustomFood] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const trips = listTrips();
    setTrip(trips[0] ?? null);
  }, []);

  const latestCheckedAt = useMemo(() => {
    if (!trip) return "";
    const links = trip.days.flatMap((day) => day.items.flatMap((item) => item.sourceLinks));
    return links[0]?.checkedAt ? new Date(links[0].checkedAt).toLocaleString("ko-KR") : "";
  }, [trip]);

  const duplicatePlaces = useMemo(() => {
    if (!trip) return [];
    const count = new Map<string, number>();
    trip.days.forEach((day) => {
      day.items.forEach((item) => count.set(item.placeName, (count.get(item.placeName) ?? 0) + 1));
    });
    return Array.from(count.entries())
      .filter(([, total]) => total > 1)
      .map(([place]) => place);
  }, [trip]);
  const preset = useMemo(() => getDestinationPreset(draft.destination), [draft.destination]);
  const mustVisitOptions = useMemo(() => preset.mustVisits.slice(0, 5), [preset]);
  const foodOptions = useMemo(() => preset.foodAreas.slice(0, 5), [preset]);

  useEffect(() => {
    setSelectedMustVisits((current) => {
      const currentFromPreset = current.filter((item) => mustVisitOptions.includes(item));
      const customItems = current.filter((item) => !preset.mustVisits.includes(item));
      return currentFromPreset.length ? [...currentFromPreset, ...customItems] : [...mustVisitOptions.slice(0, 3), ...customItems];
    });
  }, [mustVisitOptions, preset.mustVisits]);

  useEffect(() => {
    setSelectedFoodAreas((current) => {
      const currentFromPreset = current.filter((item) => foodOptions.includes(item));
      const customItems = current.filter((item) => !preset.foodAreas.includes(item));
      return currentFromPreset.length ? [...currentFromPreset, ...customItems] : [foodOptions[0], ...customItems].filter(Boolean);
    });
  }, [foodOptions, preset.foodAreas]);

  function toggleSelection(value: string, selected: string[], setSelected: (value: string[]) => void) {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function addCustom(value: string, selected: string[], setSelected: (value: string[]) => void, clear: (value: string) => void) {
    const clean = value.trim();
    if (!clean) return;
    if (!selected.includes(clean)) setSelected([...selected, clean]);
    clear("");
  }

  function buildDraftForSubmit() {
    return {
      ...draft,
      interests: selectedInterests.join(", "),
      mustVisits: selectedMustVisits.join(", "),
      food: selectedFoodAreas.join(", ")
    };
  }

  function selectDestination(destination: string) {
    setDraft({ ...draft, destination });
  }

  async function callAgent(body: unknown) {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("에이전트가 응답하지 않았습니다.");
    }

    return response.json() as Promise<{ trip: Trip }>;
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setShareMessage("");

    try {
      const submitDraft = buildDraftForSubmit();
      const result = await callAgent({ mode: "generate", draft: submitDraft });
      setTrip(result.trip);
      saveTrip(result.trip);
      setStatusMessage(`${result.trip.title} 초안을 만들었습니다. 중복 장소와 예약 체크 항목을 확인하세요.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevise() {
    if (!trip || !revision.trim()) return;
    setLoading(true);

    try {
      const result = await callAgent({ mode: "revise", trip, request: revision });
      setTrip(result.trip);
      saveTrip(result.trip);
      setStatusMessage(`"${revision}" 요청을 반영했습니다.`);
      setRevision("");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!trip) return;
    const url = makeShareUrl(trip);
    await navigator.clipboard.writeText(url);
    setShareMessage("읽기 전용 공유 링크를 복사했습니다.");
  }

  function exportMarkdown() {
    if (!trip) return;
    downloadText(`${trip.title}.md`, tripToMarkdown(trip), "text/markdown;charset=utf-8");
  }

  function exportCalendar() {
    if (!trip) return;
    downloadText(`${trip.title}.ics`, tripToIcs(trip), "text/calendar;charset=utf-8");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-icon">
            <Plane size={24} />
          </div>
          <div>
            <p className="kicker">한국어 여행 일정 설계 에이전트</p>
            <h1>여행을 대화로 만들고, 일정표로 바로 쓰세요</h1>
          </div>
        </div>
        <div className="button-row no-print">
          <button className="btn" type="button" onClick={() => window.print()} title="PDF로 인쇄">
            <Printer size={18} /> PDF
          </button>
          <button className="btn" type="button" onClick={exportMarkdown} disabled={!trip} title="문서로 내보내기">
            <FileDown size={18} /> 문서
          </button>
          <button className="btn" type="button" onClick={exportCalendar} disabled={!trip} title="캘린더로 내보내기">
            <Download size={18} /> 캘린더
          </button>
        </div>
      </header>

      <div className="layout-grid">
        <section className="panel composer no-print">
          <h2>여행 만들기</h2>
          <form onSubmit={handleGenerate}>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="destination">목적지</label>
                <input id="destination" value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="travelers">인원</label>
                <input
                  id="travelers"
                  min="1"
                  type="number"
                  value={draft.travelers}
                  onChange={(event) => setDraft({ ...draft, travelers: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="startDate">시작일</label>
                <input id="startDate" type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="endDate">종료일</label>
                <input id="endDate" type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="pace">여행 속도</label>
                <select id="pace" value={draft.pace} onChange={(event) => setDraft({ ...draft, pace: event.target.value as TripDraft["pace"] })}>
                  <option>여유롭게</option>
                  <option>보통</option>
                  <option>알차게</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="budget">예산</label>
                <input id="budget" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} />
              </div>
              <div className="field full">
                <label>빠른 목적지 선택</label>
                <div className="chip-row">
                  {destinationOptions.map((item) => (
                    <button className={`chip ${draft.destination === item ? "selected" : ""}`} type="button" key={item} onClick={() => selectDestination(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field full">
                <label>관심사</label>
                <div className="chip-row">
                  {interestOptions.map((item) => (
                    <button
                      className={`chip ${selectedInterests.includes(item) ? "selected" : ""}`}
                      type="button"
                      key={item}
                      onClick={() => toggleSelection(item, selectedInterests, setSelectedInterests)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="inline-add">
                  <input id="customInterest" value={customInterest} onChange={(event) => setCustomInterest(event.target.value)} placeholder="예: 온천, 서점, 아이와 함께, 사진 명소" />
                  <button className="btn" type="button" onClick={() => addCustom(customInterest, selectedInterests, setSelectedInterests, setCustomInterest)}>
                    추가
                  </button>
                </div>
              </div>
              <div className="field full">
                <label>꼭 가고 싶은 곳</label>
                <div className="chip-row">
                  {mustVisitOptions.map((item) => (
                    <button
                      className={`chip ${selectedMustVisits.includes(item) ? "selected" : ""}`}
                      type="button"
                      key={item}
                      onClick={() => toggleSelection(item, selectedMustVisits, setSelectedMustVisits)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="inline-add">
                  <input id="customMustVisit" value={customMustVisit} onChange={(event) => setCustomMustVisit(event.target.value)} placeholder="예: 예약한 호텔, 친구가 추천한 카페" />
                  <button className="btn" type="button" onClick={() => addCustom(customMustVisit, selectedMustVisits, setSelectedMustVisits, setCustomMustVisit)}>
                    추가
                  </button>
                </div>
              </div>
              <div className="field full">
                <label>음식 취향 / 맛집 구역</label>
                <div className="chip-row">
                  {foodOptions.map((item) => (
                    <button
                      className={`chip ${selectedFoodAreas.includes(item) ? "selected" : ""}`}
                      type="button"
                      key={item}
                      onClick={() => toggleSelection(item, selectedFoodAreas, setSelectedFoodAreas)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="inline-add">
                  <input id="customFood" value={customFood} onChange={(event) => setCustomFood(event.target.value)} placeholder="예: 라멘, 해산물, 채식, 디저트, 아이 동반 식당" />
                  <button className="btn" type="button" onClick={() => addCustom(customFood, selectedFoodAreas, setSelectedFoodAreas, setCustomFood)}>
                    추가
                  </button>
                </div>
              </div>
              <div className="field full">
                <button className="btn subtle" type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
                  {showAdvanced ? "고급 옵션 닫기" : "고급 옵션 열기"}
                </button>
              </div>
              {showAdvanced ? (
                <div className="field full">
                  <label htmlFor="avoid">피하고 싶은 것</label>
                  <textarea id="avoid" value={draft.avoid} onChange={(event) => setDraft({ ...draft, avoid: event.target.value })} />
                </div>
              ) : null}
              <div className="field full">
                <label>비 오는 날 대안</label>
                <div className="chip-row">
                  {preset.rainyOptions.map((item) => (
                    <button className="chip" type="button" key={item} onClick={() => toggleSelection(`우천 대안: ${item}`, selectedInterests, setSelectedInterests)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="btn primary" type="submit" disabled={loading || !draft.destination || !draft.startDate || !draft.endDate}>
              {loading ? <RefreshCw size={18} /> : <Sparkles size={18} />} 일정 생성
            </button>
          </form>

          <div className="status-note">
            <Sparkles size={18} />
            <span>{statusMessage}</span>
          </div>
        </section>

        <section className="workspace">
          {trip ? (
            <>
              <div className="panel trip-header">
                <div>
                  <h2 className="trip-title">{trip.title}</h2>
                  <div className="meta-row">
                    <span className="pill">
                      <CalendarDays size={15} /> {trip.startDate} ~ {trip.endDate}
                    </span>
                    <span className="pill">
                      <Users size={15} /> {trip.travelers}명
                    </span>
                    <span className="pill">
                      <MapPin size={15} /> {trip.destination}
                    </span>
                    <span className="pill">
                      <Clock size={15} /> 최신 확인 {latestCheckedAt || "대기 중"}
                    </span>
                  </div>
                </div>
                <div className="button-row no-print">
                  <button className="btn" type="button" onClick={handleShare}>
                    <Share2 size={18} /> 공유
                  </button>
                  <button className="btn icon" type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(trip, null, 2))} title="JSON 복사">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              {shareMessage ? <div className="notice no-print">{shareMessage}</div> : null}
              {duplicatePlaces.length ? (
                <div className="notice no-print">
                  <strong>중복 장소 확인 필요</strong>
                  <p>
                    {duplicatePlaces.join(", ")} 항목이 여러 번 들어갔습니다. 수정 요청에 “중복 장소 빼고 다시 짜줘”라고 입력하면 정리할 수 있어요.
                  </p>
                </div>
              ) : null}

              <div className="panel utility-panel no-print">
                <h3>대화로 수정</h3>
                <div className="revision-box">
                  <input
                    value={revision}
                    onChange={(event) => setRevision(event.target.value)}
                    placeholder="예: 부모님과 가니 덜 걷게 바꿔줘 / 맛집 위주로 바꿔줘 / 비 오는 날 대안 넣어줘"
                  />
                  <button className="btn primary icon" type="button" onClick={handleRevise} disabled={loading || !revision.trim()} title="수정 요청 보내기">
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="day-list">
                {trip.days.map((day) => (
                  <article className="panel day" key={day.id}>
                    <div className="day-heading">
                      <div>
                        <h3>{formatKoreanDate(day.date)}</h3>
                        <p className="kicker">{day.area}</p>
                      </div>
                      <p className="pill">{day.weatherSummary}</p>
                    </div>
                    <div className="timeline">
                      {day.items.map((item) => (
                        <div className="timeline-item" key={item.id}>
                          <div className="time">{item.time}</div>
                          <div>
                            <div className="item-top">
                              <h4 className="item-title">{item.placeName}</h4>
                              <span className="pill">{item.reservationNeeded ? "예약 권장" : "예약 선택"}</span>
                            </div>
                            <p className="item-text">{item.description}</p>
                            <div className="meta-row">
                              <span className="pill">이동 {item.move}</span>
                              <span className="pill">비용 {item.estimatedCost}</span>
                              {item.meal ? <span className="pill">{item.meal}</span> : null}
                            </div>
                            <div className="source-row">
                              {item.sourceLinks.map((source) => (
                                <a className="source-link" href={source.url} key={`${item.id}-${source.url}`} target="_blank" rel="noreferrer">
                                  <ExternalLink size={13} /> {source.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="side-grid no-print">
                <section className="panel utility-panel">
                  <h3>
                    <Bell size={18} /> 앱 안 알림
                  </h3>
                  <div className="alert-list">
                    {trip.alerts.map((alert) => (
                      <div className="alert" key={alert.id}>
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel utility-panel">
                  <h3>
                    <CheckCircle2 size={18} /> API 확장 질문
                  </h3>
                  <div className="alert-list">
                    {trip.agentQuestions.map((question) => (
                      <div className="question" key={question.id}>
                        <strong>{question.question}</strong>
                        <p>{question.reason}</p>
                        <div className="button-row">
                          {question.options.map((option) => (
                            <span className="pill" key={option}>
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="panel empty-state">
              <div>
                <Sparkles size={44} />
                <h2>첫 여행 일정을 만들어보세요</h2>
                <p>목적지와 날짜를 입력하면 하루별 시간표, 지도 링크, 예약 체크리스트를 한 번에 구성합니다.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
