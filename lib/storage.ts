"use client";

import type { ChatMessage, Trip } from "@/lib/types";

const TRIPS_KEY = "travel-agent.trips";
const CHAT_KEY = "travel-agent.chat";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listTrips() {
  return readJson<Trip[]>(TRIPS_KEY, []);
}

export function saveTrip(trip: Trip) {
  const trips = listTrips();
  const next = [trip, ...trips.filter((item) => item.id !== trip.id)];
  writeJson(TRIPS_KEY, next);
}

export function getTrip(id: string) {
  return listTrips().find((trip) => trip.id === id) ?? null;
}

export function saveChat(messages: ChatMessage[]) {
  writeJson(CHAT_KEY, messages);
}

export function getChat() {
  return readJson<ChatMessage[]>(CHAT_KEY, []);
}

export function makeShareUrl(trip: Trip) {
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(trip)))));
  return `${window.location.origin}/share/${trip.id}#data=${encoded}`;
}

export function readSharedTripFromHash() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#data=/, "");
  if (!hash) return null;

  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(hash))));
    return JSON.parse(json) as Trip;
  } catch {
    return null;
  }
}

export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
