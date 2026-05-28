"use client";

import { CalendarDays, Clock, ExternalLink, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { formatKoreanDate } from "@/lib/date";
import { readSharedTripFromHash } from "@/lib/storage";
import type { Trip } from "@/lib/types";

export function SharedTrip() {
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    setTrip(readSharedTripFromHash());
  }, []);

  if (!trip) {
    return (
      <main className="share-page">
        <div className="notice">
          <h1>공유된 여행을 불러오지 못했습니다</h1>
          <p>공유 링크에 일정 데이터가 포함되어 있는지 확인해주세요.</p>
        </div>
      </main>
    );
  }

  const checkedAt = trip.days.flatMap((day) => day.items.flatMap((item) => item.sourceLinks))[0]?.checkedAt;

  return (
    <main className="share-page">
      <section className="panel trip-header">
        <div>
          <p className="kicker">읽기 전용 공유 일정</p>
          <h1 className="trip-title">{trip.title}</h1>
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
              <Clock size={15} /> 최신 확인 {checkedAt ? new Date(checkedAt).toLocaleString("ko-KR") : "대기 중"}
            </span>
          </div>
        </div>
      </section>

      <div className="day-list">
        {trip.days.map((day) => (
          <article className="panel day" key={day.id}>
            <div className="day-heading">
              <div>
                <h2>{formatKoreanDate(day.date)}</h2>
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
                      <h3 className="item-title">{item.placeName}</h3>
                      <span className="pill">{item.reservationNeeded ? "예약 권장" : "예약 선택"}</span>
                    </div>
                    <p className="item-text">{item.description}</p>
                    <div className="meta-row">
                      <span className="pill">이동 {item.move}</span>
                      <span className="pill">비용 {item.estimatedCost}</span>
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

      <section className="panel utility-panel">
        <h2>예약 체크리스트</h2>
        <div className="alert-list">
          {trip.alerts.map((alert) => (
            <div className="alert" key={alert.id}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
