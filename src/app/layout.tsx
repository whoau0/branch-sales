import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의원두 | 지점 매출 및 공휴일 분석 대시보드",
  description: "카페 프랜차이즈 오늘의원두 지점 매출 및 공휴일 분석 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
