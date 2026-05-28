import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "여행 일정 설계 에이전트",
  description: "한국어 대화형 여행 일정 설계 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
