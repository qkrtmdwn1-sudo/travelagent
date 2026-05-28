import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildFallbackTrip, reviseTrip } from "@/lib/sample-agent";
import type { Trip, TripDraft } from "@/lib/types";

export const runtime = "nodejs";

type GenerateBody = {
  mode: "generate";
  draft: TripDraft;
};

type ReviseBody = {
  mode: "revise";
  trip: Trip;
  request: string;
};

type AgentBody = GenerateBody | ReviseBody;

const SYSTEM_PROMPT = `
너는 한국어 여행 일정 설계 에이전트다.
사용자에게 현실적인 하루별 일정표를 제공한다.
반드시 JSON만 반환한다.
장소, 이동, 식사, 예상 비용, 예약 필요 여부, 출처 링크, 확인 시점을 포함한다.
웹 검색이 필요한 정보는 sourceLinks에 검색 또는 지도 링크를 넣고, 장기 날씨는 불확실성을 표시한다.
항공/숙소/예약 가격처럼 API 연동이 더 정확한 항목은 agentQuestions에 짧은 확인 질문으로 제안한다.
`;

async function generateWithOpenAI(draft: TripDraft) {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fallback = buildFallbackTrip(draft);

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    instructions: SYSTEM_PROMPT,
    input: `다음 초안을 기반으로 여행 일정을 보강해줘. 기존 JSON 스키마와 동일하게 반환해.\n${JSON.stringify(fallback)}`,
    tools: [{ type: "web_search_preview" }]
  } as never);

  const text = response.output_text;
  if (!text) return fallback;

  try {
    return JSON.parse(text) as Trip;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentBody;

    if (body.mode === "generate") {
      const trip = (await generateWithOpenAI(body.draft)) ?? buildFallbackTrip(body.draft);
      return NextResponse.json({ trip });
    }

    const trip = reviseTrip(body.trip, body.request);
    return NextResponse.json({ trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
