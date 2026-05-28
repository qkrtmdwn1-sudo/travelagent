import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "여행 일정 설계 에이전트",
  description: "한국어 대화형 여행 일정 설계 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
