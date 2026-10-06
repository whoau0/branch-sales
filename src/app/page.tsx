import Link from "next/link";
import Image from "next/image";
import { Coffee, Store, LayoutDashboard, ArrowRight, ShieldCheck, CalendarDays, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Image with Dark & Warm Coffee Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cafe-hero.jpg"
          alt="오늘의원두 매장 인테리어"
          fill
          priority
          className="object-cover object-center opacity-30 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide">오늘의원두</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-amber-400/90 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              FRANCHISE ERP
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-1.5 rounded-lg"
        >
          <LayoutDashboard className="w-4 h-4" />
          본사 대시보드
        </Link>
      </header>

      {/* Main Hero Section */}
      <div className="relative z-10 max-w-5xl w-full mx-auto px-6 py-12 md:py-16 flex-1 flex flex-col justify-center items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6 shadow-sm backdrop-blur-md">
          <Coffee className="w-3.5 h-3.5" />
          카페 프랜차이즈 지점 매출 & 공휴일 분석 시스템
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          지점별 실시간 매출 취합과 <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
            공휴일 영향도 분석
          </span>
          을 한눈에
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          카카오톡과 엑셀로 분산되던 5개 지점의 월별 매출 보고를 웹으로 일원화합니다.
          지점장은 간편하게 입력하고, 본사는 언제 어디서나 실시간 지표를 조회하세요.
        </p>

        {/* Action Cards / Buttons */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {/* 1. 지점장 매출 입력 */}
          <Link
            href="/input"
            className="group relative p-5 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-2xl shadow-xl shadow-amber-900/40 border border-amber-400/30 text-left transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-amber-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <h2 className="text-lg font-bold text-white">지점장 매출 입력</h2>
            <p className="text-xs text-amber-100/80 mt-1">
              간이 PIN 번호 인증 후 당월 매출·객수 간편 입력
            </p>
          </Link>

          {/* 2. 본사 대시보드 */}
          <Link
            href="/dashboard"
            className="group relative p-5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl shadow-xl shadow-black/40 border border-slate-700/80 hover:border-slate-600 text-left transition-all duration-300 hover:-translate-y-1 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h2 className="text-lg font-bold text-white">대표 / 본사 대시보드</h2>
            <p className="text-xs text-slate-400 mt-1">
              월별 매출 추이, 공휴일 복합 차트, 지점별 실적 비교
            </p>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-6 max-w-lg w-full text-center text-xs text-slate-400">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">5개 지점 PIN 연동</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <CalendarDays className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-slate-200">공휴일 API 연동</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">실시간 추이 차트</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 bg-slate-950/60 backdrop-blur-sm">
        <p>대상 지점: 용산역점 · 삼각지점 · 이태원점 · 효창공원점 · 한남점</p>
        <p className="mt-0.5 text-slate-400">오늘의원두 지점 매출 관리 시스템 © 2026</p>
      </footer>
    </main>
  );
}
